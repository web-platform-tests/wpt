from collections import OrderedDict, defaultdict
from datetime import timedelta, timezone

from hypothesis import strategies

from cbor2 import FrozenDict

# Tune these for test run time
MAX_SIZE = 5
MAX_LEAVES = 2

# Seconds in timezones get rounded when serialised, so we can only test whole minute
# timezones for invariance
timezones = strategies.integers(min_value=-(24 * 60 - 1), max_value=24 * 60 - 1).map(
    lambda m: timezone(timedelta(minutes=m))
)

basic_immutable_strategy = strategies.one_of(
    strategies.none(),
    strategies.booleans(),
    strategies.integers(),
    strategies.binary(),
    strategies.text(),
    # nan != nan, so we can't test invariance with it
    strategies.floats(allow_nan=False),
    strategies.decimals(allow_nan=False),
    strategies.datetimes(timezones=timezones),
    # TODO: this needs to be fetched from impl fixture instead of imported
    # strategies.just(undefined),
    strategies.fractions(),
    strategies.uuids(),
    strategies.ip_addresses(),
    # TODO: regex objects for hypothesis
    # MIMEText("foo") != MIMEText("foo"), so we cannot use it to test invariance
    # strategies.text().map(MIMEText),
)
basic_types_strategy = strategies.one_of(
    basic_immutable_strategy,
    strategies.binary().map(bytearray),
)


@strategies.composite
def arbitrary_length_tuple(draw, child_types):
    i = draw(strategies.integers(min_value=0, max_value=MAX_SIZE))
    return tuple(draw(child_types) for _ in range(i))


dict_keys_strategy = strategies.one_of(
    basic_immutable_strategy, arbitrary_length_tuple(basic_immutable_strategy)
)

compound_types_strategy = strategies.recursive(
    strategies.one_of(
        basic_types_strategy,
        strategies.sets(basic_immutable_strategy, max_size=MAX_SIZE),
        strategies.frozensets(basic_immutable_strategy, max_size=MAX_SIZE),
    ),
    lambda children: strategies.one_of(
        strategies.lists(children, max_size=MAX_SIZE),
        # lists and tuples encode to the same, so we can't test invariance with it.
        # Dictionary keys, however, always need to encode to tuples since lists aren't
        # immutable
        strategies.dictionaries(dict_keys_strategy, children, max_size=MAX_SIZE),
        strategies.dictionaries(
            dict_keys_strategy,
            children,
            dict_class=lambda *a: defaultdict(None, *a),
            max_size=MAX_SIZE,
        ),
        strategies.dictionaries(
            dict_keys_strategy, children, dict_class=OrderedDict, max_size=MAX_SIZE
        ),
        strategies.dictionaries(
            dict_keys_strategy, children, dict_class=FrozenDict, max_size=MAX_SIZE
        ),
    ),
    max_leaves=MAX_LEAVES,
)
