from __future__ import print_function

import os, sys, json, re

script_directory = os.path.dirname(os.path.abspath(__file__))
template_directory = os.path.abspath(
    os.path.join(script_directory, 'template'))
test_root_directory = os.path.abspath(
    os.path.join(script_directory, '..', '..', '..'))


def get_template(basename):
    with open(os.path.join(template_directory, basename), "r") as f:
        return f.read()


def write_file(filename, contents):
    with open(filename, "w") as f:
        f.write(contents)


def read_nth_line(fp, line_number):
    fp.seek(0)
    for i, line in enumerate(fp):
        if (i + 1) == line_number:
            return line


def load_spec_json(path_to_spec):
    re_error_location = re.compile('line ([0-9]+) column ([0-9]+)')
    with open(path_to_spec, "r") as f:
        try:
            return json.load(f)
        except ValueError as ex:
            print(ex.message)
            match = re_error_location.search(ex.message)
            if match:
                line_number, column = int(match.group(1)), int(match.group(2))
                print(read_nth_line(f, line_number).rstrip())
                print(" " * (column - 1) + "^")
            sys.exit(1)


class GeneratedPolicyDelivery(object):
    def __init__(self):
        self.meta = ''
        self.headers = {}
        self.error = ''


class ShouldSkip(Exception):
    def __init__(self):
        pass


class PolicyDelivery(object):
    def __init__(self, delivery_type, key, value):
        '''
    Properties:
      meta (str): HTML string containing <meta> elements.
      headers (typing.Dict[str, str]): HTTP headers.
      error (str): error message if `policy_deliveries` is invalid.
    '''

        self.delivery_type = delivery_type
        self.key = key
        self.value = value

    @classmethod
    def list_from_json(cls, list, target_policy_delivery, source_context_type,
                       subresource_type, delivery_type_schema):
        # type: (dict, PolicyDelivery, SourceContext) -> typing.List[PolicyDelivery]
        if list is None:
            return []

        out = []
        for obj in list:
            policy_delivery = PolicyDelivery.from_json(
                obj, target_policy_delivery, source_context_type,
                subresource_type, delivery_type_schema)
            # Drop entries with null values.
            if policy_delivery.value is None:
                continue
            out.append(policy_delivery)
        return out

    def _is_supported(self, source_context_type, subresource_type,
                      delivery_type_schema):
        if source_context_type == 'req':
            return subresource_type in delivery_type_schema[
                self.delivery_type]['supportedSubresources']
        else:
            return source_context_type in delivery_type_schema[
                self.delivery_type]['supportedSourceContexts']

    @classmethod
    def from_json(cls, obj, target_policy_delivery, source_context_type,
                  subresource_type, delivery_type_schema):
        # type: (dict, PolicyDelivery, SourceContext, dict) -> PolicyDelivery
        '''
           Creates PolicyDelivery from `obj`.
           In addition to dicts (in the same format as to_json() outputs),
           this method accepts the following placeholders:
             "policy":
               `target_policy_delivery`
             "policyIfNonNull":
               `target_policy_delivery` if its value is not None.
             "anotherPolicy":
               A PolicyDelivery that has the same key as
               `target_policy_delivery` but a different value.
               The delivery type is selected from supported delivery types of
               `source_context_type`.
        '''

        if obj == "policy":
            policy_delivery = target_policy_delivery
        elif obj == "nonNullPolicy":
            if target_policy_delivery.value is None:
                raise ShouldSkip()
            policy_delivery = target_policy_delivery
        elif obj == "anotherPolicy":
            policy_delivery = target_policy_delivery.get_another_policy(
                source_context_type, delivery_type_schema)
        elif type(obj) == dict:
            policy_delivery = PolicyDelivery(obj['deliveryType'], obj['key'],
                                             obj['value'])
        else:
            raise Exception('policy delivery is invalid: ' + obj)

        # Omit unsupported combinations of source contexts and delivery type.
        if not policy_delivery._is_supported(
                source_context_type, subresource_type, delivery_type_schema):
            raise ShouldSkip()

        return policy_delivery

    def to_json(self):
        return {
            "deliveryType": self.delivery_type,
            "key": self.key,
            "value": self.value
        }

    def get_another_policy(self, source_context_type, delivery_type_schema):
        # type: (SourceContext) -> PolicyDelivery
        def _get_supported_delivery_types(source_context_type,
                                          delivery_type_schema):
            delivery_types = []
            for delivery_type in delivery_type_schema:
                if source_context_type in delivery_type_schema[delivery_type][
                        'supportedSourceContexts']:
                    delivery_types.append(delivery_type)
            return delivery_types

        delivery_type = _get_supported_delivery_types(source_context_type,
                                                      delivery_type_schema)[0]
        if self.key == 'referrerPolicy':
            if self.value == 'no-referrer':
                return PolicyDelivery(delivery_type, self.key, 'unsafe-url')
            else:
                return PolicyDelivery(delivery_type, self.key, 'no-referrer')
        else:
            raise Exception('delivery key is invalid: ' + self.key)

    def _generate_iter(self, result):
        # type: (GeneratedPolicyDelivery) -> None
        '''Generate <meta> elements or HTTP headers for the given list of
        PolicyDelivery.

        Returns: An object with the following keys:
        '''

        # TODO(hiroshige): Merge duplicated code here, scope/document.py, etc.
        # TODO(kristijanburnik): Implement the mixed-content opt-in-method here.
        if self.value is None:
            return
        if self.delivery_type == 'meta':
            if self.key == 'referrerPolicy':
                result.meta += '<meta name="referrer" content="%s">' % self.value
            elif self.key == 'mixedContent':
                assert (self.value == 'opt-in')
                result.meta += '<meta http-equiv="Content-Security-Policy" ' + 'content="block-all-mixed-content">'
            else:
                result.error = 'invalid delivery key'
        elif self.delivery_type == 'http-rp':
            if self.key == 'referrerPolicy':
                result.headers['Referrer-Policy'] = self.value
                # TODO(kristijanburnik): Limit to WPT origins.
                result.headers['Access-Control-Allow-Origin'] = '*'
            elif self.key == 'mixedContent':
                assert (self.value == 'opt-in')
                result.headers[
                    'Content-Security-Policy'] = 'block-all-mixed-content'
            else:
                result.error = 'invalid delivery key for http-rp: %s' % self.key
        else:
            result.error = 'invalid deliveryType: %s' % self.delivery_type

    @classmethod
    def generate(self, policy_deliveries):
        # type: (typing.List[PolicyDelivery]) -> GeneratedPolicyDelivery
        result = GeneratedPolicyDelivery()
        for delivery in policy_deliveries:
            delivery._generate_iter(result)
        return result


class SourceContext(object):
    def __init__(self, source_context_type, policy_deliveries):
        # type: (unicode, typing.List[PolicyDelivery]) -> None
        self.source_context_type = source_context_type
        self.policy_deliveries = policy_deliveries

    @classmethod
    def from_json(cls, obj, target_policy_delivery, subresource_type,
                  delivery_type_schema):
        policy_deliveries = PolicyDelivery.list_from_json(
            obj.get('policyDeliveries'), target_policy_delivery,
            obj.get('sourceContextType'), subresource_type,
            delivery_type_schema)
        return SourceContext(obj.get('sourceContextType'), policy_deliveries)

    def to_json(self):
        return {
            "sourceContextType": self.source_context_type,
            "policyDeliveries": [x.to_json() for x in self.policy_deliveries]
        }
