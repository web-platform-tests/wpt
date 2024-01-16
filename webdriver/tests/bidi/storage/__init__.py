from webdriver.bidi.modules.network import NetworkBytesValue, NetworkStringValue
from webdriver.bidi.modules.storage import PartialCookie, StorageKeyPartitionDescriptor
from .. import any_int, recursive_compare
from webdriver.bidi.undefined import Maybe, UNDEFINED

COOKIE_NAME = 'SOME_COOKIE_NAME'
COOKIE_VALUE = NetworkStringValue('SOME_COOKIE_VALUE')


async def assert_cookie_is_set(bidi_session, domain: str, origin: str, name: str = COOKIE_NAME,
                               value: str = COOKIE_VALUE, path: str = "/"):
    """
    Asserts the cookie is set.
    """

    all_cookies = await bidi_session.storage.get_cookies(partition=StorageKeyPartitionDescriptor(
        source_origin=origin))

    assert 'cookies' in all_cookies
    cookie = next(c for c in all_cookies['cookies'] if c['name'] == name)

    recursive_compare({
        'domain': domain,
        'httpOnly': False,
        'name': name,
        'path': path,
        'sameSite': 'none',
        'secure': True,
        # Varies depending on the cookie name and value.
        'size': any_int,
        'value': value,
    }, cookie)


def create_cookie(domain: str,
                  name: str = COOKIE_NAME,
                  value: NetworkBytesValue = COOKIE_VALUE,
                  secure: Maybe[bool] = True,
                  path: Maybe[str] = UNDEFINED,
                  http_only: Maybe[bool] = UNDEFINED,
                  same_site: Maybe[str] = UNDEFINED,
                  expiry: Maybe[int] = UNDEFINED,
                  ) -> PartialCookie:
    """
    Creates a cookie with the given or default options.
    """
    return PartialCookie(
        domain=domain,
        name=name,
        value=value,
        path=path,
        http_only=http_only,
        secure=secure,
        same_site=same_site,
        expiry=expiry)
