from __future__ import print_function

import argparse
import copy
import json
import os
import sys

import spec_validator
import util


def expand_pattern(expansion_pattern, test_expansion_schema):
    expansion = {}
    for artifact_key in expansion_pattern:
        artifact_value = expansion_pattern[artifact_key]
        if artifact_value == '*':
            expansion[artifact_key] = test_expansion_schema[artifact_key]
        elif isinstance(artifact_value, list):
            expansion[artifact_key] = artifact_value
        elif isinstance(artifact_value, dict):
            # Flattened expansion.
            expansion[artifact_key] = []
            values_dict = expand_pattern(artifact_value,
                                         test_expansion_schema[artifact_key])
            for sub_key in values_dict.keys():
                expansion[artifact_key] += values_dict[sub_key]
        else:
            expansion[artifact_key] = [artifact_value]

    return expansion


def permute_expansion(expansion,
                      artifact_order,
                      selection={},
                      artifact_index=0):
    assert isinstance(artifact_order, list), "artifact_order should be a list"

    if artifact_index >= len(artifact_order):
        yield selection
        return

    artifact_key = artifact_order[artifact_index]

    for artifact_value in expansion[artifact_key]:
        selection[artifact_key] = artifact_value
        for next_selection in permute_expansion(expansion, artifact_order,
                                                selection, artifact_index + 1):
            yield next_selection


class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, util.SourceContext):
            return obj.to_json()
        if isinstance(obj, util.PolicyDelivery):
            return obj.to_json()

        return json.JSONEncoder.default(self, obj)


def create_test_filename(config, selection):
    '''Returns the filname for the main test HTML file'''

    selection_for_filename = copy.deepcopy(selection)
    # Use 'unset' rather than 'None' in test filenames.
    if selection_for_filename['delivery_value'] is None:
        selection_for_filename['delivery_value'] = 'unset'

    test_filename = os.path.join(
        config.spec_directory,
        config.test_file_path_pattern % selection_for_filename)

    # Create the directory for the test files.
    try:
        os.makedirs(os.path.dirname(test_filename))
    except:
        pass

    return test_filename


def create_source_context_list(source_context_schema, delivery_type_schema,
                               selection):
    source_context_list = []
    if 'delivery_value' in selection:
        # - Replace placeholders ('policy', 'anotherPolicy') in
        #   sourceContextList with an actual PolicyDelivery object.
        # - Filter out unsupported delivery type
        #   (i.e. if apply_delivery() returns None).
        target_policy_delivery = util.PolicyDelivery(
            selection['delivery_type'], selection['delivery_key'],
            selection['delivery_value'])

        source_contexts_json = source_context_schema[
            selection['source_context']]['sourceContextList']
        for source_context in source_contexts_json:
            source_context_list.append(
                util.SourceContext.from_json(
                    source_context, target_policy_delivery,
                    selection['subresource'], delivery_type_schema))

    # We no longer need delivery-related fields in `selection`, because
    # they will be processed via `source_context_list`.
    # Therefore we delete such fields, to include only necessary fields
    # in generated test files.
    del selection['source_context']
    del selection['delivery_type']
    del selection['delivery_key']
    del selection['delivery_value']

    return source_context_list


def generate_selection(source_context_schema, delivery_type_schema, config,
                       selection, spec, test_html_template_basename):
    test_filename = create_test_filename(config, selection)
    try:
        source_context_list = create_source_context_list(
            source_context_schema, delivery_type_schema, selection)
    except util.ShouldSkip:
        return

    top_source_context = source_context_list.pop(0)
    assert (top_source_context.source_context_type == 'top')
    top_deliveries = util.PolicyDelivery.generate(
        top_source_context.policy_deliveries)

    subresource_source_context = source_context_list.pop()
    assert (subresource_source_context.source_context_type == 'req')
    selection[
        'subresource_policy_deliveries'] = subresource_source_context.policy_deliveries
    selection['source_context_list'] = source_context_list

    # Errors in handle_deliveries() indicates e.g. deliveryType is not
    # supported in given context, e.g. http-rp in srcdoc iframe.
    assert (top_deliveries.error == '')
    if len(top_deliveries.headers) > 0:
        with open(test_filename + ".headers", "w") as f:
            for header in top_deliveries.headers:
                f.write('%s: %s\n' % (header, top_deliveries.headers[header]))

    test_parameters = json.dumps(
        selection, indent=2, separators=(',', ':'), cls=CustomEncoder)
    # Adjust the template for the test invoking JS. Indent it to look nice.
    indent = "\n" + " " * 8
    test_parameters = test_parameters.replace("\n", indent)

    selection['meta_delivery_method'] = top_deliveries.meta
    # Obey the lint and pretty format.
    if len(selection['meta_delivery_method']) > 0:
        selection['meta_delivery_method'] = "\n    " + \
                                            selection['meta_delivery_method']

    selection['test_js'] = '''
      TestCase(
        %s,
        "%s"
      ).start();
      ''' % (test_parameters, (config.test_description_template % selection))

    selection[
        'test_page_title'] = config.test_page_title_template % spec['title']
    selection['spec_description'] = spec['description']
    selection['spec_specification_url'] = spec['specification_url']
    selection['helper_js'] = config.helper_js
    selection['sanity_checker_js'] = config.sanity_checker_js
    selection['spec_json_js'] = config.spec_json_js

    test_html_template = util.get_template(test_html_template_basename)
    disclaimer_template = util.get_template('disclaimer.template')

    html_template_filename = os.path.join(util.template_directory,
                                          test_html_template_basename)
    generated_disclaimer = disclaimer_template \
        % {'generating_script_filename': os.path.relpath(sys.argv[0],
                                                         util.test_root_directory),
           'html_template_filename': os.path.relpath(html_template_filename,
                                                     util.test_root_directory)}

    # Adjust the template for the test invoking JS. Indent it to look nice.
    selection['generated_disclaimer'] = generated_disclaimer.rstrip()

    # Write out the generated HTML file.
    util.write_file(test_filename, test_html_template % selection)


def generate_test_source_files(config, spec_json, target):
    test_expansion_schema = spec_json['test_expansion_schema']
    specification = spec_json['specification']
    source_context_schema = spec_json['source_context_schema']
    delivery_type_schema = spec_json['delivery_type_schema']

    spec_json_js_template = util.get_template('spec_json.js.template')
    generated_spec_json_filename = os.path.join(config.spec_directory,
                                                "spec_json.js")
    util.write_file(
        generated_spec_json_filename,
        spec_json_js_template % {'spec_json': json.dumps(spec_json)})

    # Choose a debug/release template depending on the target.
    html_template = "test.%s.html.template" % target

    artifact_order = test_expansion_schema.keys() + ['name']
    artifact_order.remove('expansion')

    # Create list of excluded tests.
    exclusion_dict = {}
    for excluded_pattern in spec_json['excluded_tests']:
        excluded_expansion = \
            expand_pattern(excluded_pattern, test_expansion_schema)
        for excluded_selection in permute_expansion(excluded_expansion,
                                                    artifact_order):
            excluded_selection_path = config.selection_pattern % excluded_selection
            exclusion_dict[excluded_selection_path] = True

    for spec in specification:
        # Used to make entries with expansion="override" override preceding
        # entries with the same |selection_path|.
        output_dict = {}

        for expansion_pattern in spec['test_expansion']:
            expansion = expand_pattern(expansion_pattern,
                                       test_expansion_schema)
            for selection in permute_expansion(expansion, artifact_order):
                selection['delivery_key'] = spec_json['delivery_key']
                selection_path = config.selection_pattern % selection
                if not selection_path in exclusion_dict:
                    if selection_path in output_dict:
                        if expansion_pattern['expansion'] != 'override':
                            print(
                                "Error: %s's expansion is default but overrides %s"
                                % (selection['name'],
                                   output_dict[selection_path]['name']))
                            sys.exit(1)
                    output_dict[selection_path] = copy.deepcopy(selection)
                else:
                    print('Excluding selection:', selection_path)

        for selection_path in output_dict:
            selection = output_dict[selection_path]
            generate_selection(source_context_schema, delivery_type_schema,
                               config, selection, spec, html_template)


def main(config):
    parser = argparse.ArgumentParser(
        description='Test suite generator utility')
    parser.add_argument(
        '-t',
        '--target',
        type=str,
        choices=("release", "debug"),
        default="release",
        help='Sets the appropriate template for generating tests')
    parser.add_argument(
        '-s',
        '--spec',
        type=str,
        default=None,
        help='Specify a file used for describing and generating the tests')
    # TODO(kristijanburnik): Add option for the spec_json file.
    args = parser.parse_args()

    if args.spec:
        config.spec_directory = args.spec

    spec_filename = os.path.join(config.spec_directory, "spec.src.json")
    spec_json = util.load_spec_json(spec_filename)
    spec_validator.assert_valid_spec_json(spec_json)

    generate_test_source_files(config, spec_json, args.target)
