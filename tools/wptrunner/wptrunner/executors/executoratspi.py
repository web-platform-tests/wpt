import gi

gi.require_version("Atspi", "2.0")
from gi.repository import Atspi
import json
import threading
import time

import sys


def poll_for_tab(root, product, url):
    tab = find_tab(root, product, url)
    while not tab:
        time.sleep(0.01)
        tab = find_tab(root, product, url)

    return tab


def find_tab(root, product, url):
    stack = [root]
    while stack:
        node = stack.pop()
        if Atspi.Accessible.get_role_name(node) == "frame":
            relationset = Atspi.Accessible.get_relation_set(node)
            for relation in relationset:
                if relation.get_relation_type() == Atspi.RelationType.EMBEDS:
                    tab = relation.get_target(0)
                    if is_ready(tab, product, url):
                        return tab
                    else:
                        return None
            continue

        for i in range(Atspi.Accessible.get_child_count(node)):
            child = Atspi.Accessible.get_child_at_index(node, i)
            stack.append(child)

    return None


def is_ready(tab, product, url):
    # Firefox uses the "BUSY" state to indicate the page is not ready.
    if product == "firefox":
        state_set = Atspi.Accessible.get_state_set(tab)
        return not Atspi.StateSet.contains(state_set, Atspi.StateType.BUSY)

    # Chromium family browsers do not use "BUSY", but you can
    # tell if the document can be queried by URL attribute. If the 'URL'
    # attribute is not here, we need to query for a new accessible object.
    document = Atspi.Accessible.get_document_iface(tab)
    document_attributes = Atspi.Document.get_document_attributes(document)
    if "URI" in document_attributes and document_attributes["URI"] == url:
        return True
    return False

def find_browser(name):
    desktop = Atspi.get_desktop(0)
    child_count = Atspi.Accessible.get_child_count(desktop)
    for i in range(child_count):
        app = Atspi.Accessible.get_child_at_index(desktop, i)
        full_app_name = Atspi.Accessible.get_name(app)
        if name in full_app_name.lower():
            return (app, full_app_name)
    return (None, None)


def find_node(root, dom_id):
    stack = [root]
    while stack:
        node = stack.pop()

        attributes = Atspi.Accessible.get_attributes(node)
        if "id" in attributes and attributes["id"] == dom_id:
            return TestNode(root, dom_id, node)

        for i in range(Atspi.Accessible.get_child_count(node)):
            child = Atspi.Accessible.get_child_at_index(node, i)
            stack.append(child)

    return None


class AtspiExecutorImpl:
    def setup(self, product_name, logger):
        self.logger = logger
        self.product_name = product_name
        self.full_app_name = ""
        self.root = None
        self.document = None
        self.test_url = None

        (self.root, self.full_app_name) = find_browser(self.product_name)
        if not self.root:
            self.logger.error(
                f"Couldn't find browser {self.product_name} in accessibility API ATSPI. Accessibility API queries will not succeeded."
            )

    def __poll_for_tab_if_necessary(self, url):
        if not self.root:
            raise Exception(
                f"Couldn't find browser {self.product_name} in accessibility API ATSPI. Did you turn on accessibility?"
            )

        if self.test_url != url or not self.document:
            self.test_url = url
            self.document = poll_for_tab(self.root, self.product_name, url)

    def get_accessibility_api_node(self, dom_id, url):
        self.__poll_for_tab_if_necessary(url)

        test_node = find_node(self.document, dom_id)
        if not test_node:
            raise Exception(
                f"Couldn't find node with id={dom_id} in accessibility API ATSPI."
            )

        return json.dumps(test_node.serialize())

    def test_accessibility_api(self, dom_id, test, api, url):
        self.__poll_for_tab_if_necessary(url)

        test_node = find_node(self.document, dom_id)

        results = []
        for test_statement in test['Atspi']:
            results.append(test_node.run_test_statement(TestStatement(test_statement)));

        return results


class TestNode():
    """Wrapper around an Atspi Node for testing purposes"""
    def __init__(self, root, dom_id, node):
        self.root = root
        self.dom_id = dom_id
        self.node = node

    def serialize(self):
        node_dictionary = {}
        node_dictionary["API"] = "atspi"
        node_dictionary["role"] = Atspi.Accessible.get_role_name(self.node)
        node_dictionary["name"] = Atspi.Accessible.get_name(self.node)
        node_dictionary["description"] = Atspi.Accessible.get_description(self.node)
        node_dictionary["states"] = self.get_state_list()
        node_dictionary["objectAttributes"] = Atspi.Accessible.get_attributes_as_array(self.node)
        node_dictionary["relations"] = self.get_relations_dictionary()

        return node_dictionary

    # 'statement' is a TestStatement object
    def run_test_statement(self, statement):
        if statement.type == 'property':
            return self.run_property_test(statement)

        if statement.type == 'relation':
            return self.run_relation_test(statement)

        if statement.type == 'reverseRelation':
            return self.run_reverse_relation_test(statement)
            return "not implemented reverse relations"

        return "Error: not implemented ({statement.type})"

    # 'statement' is a TestStatement object
    def run_property_test(self, statement):
        if statement.key == 'role':
            role = Atspi.Accessible.get_role_name(self.node)
            return statement.value_compare_with(role)

        if statement.key == 'objectAttributes':
            attributes = Atspi.Accessible.get_attributes_as_array(self.node)
            return statement.value_contained_or_not_contained_in(attributes)

        if statement.key == 'states':
            states = self.get_state_list()
            return statement.value_contained_or_not_contained_in(states)

        return f"Error: not implemented ({statement.key})"

    # 'statement' is a TestStatement object
    def run_relation_test(self, statement):
        expected_relation = statement.key
        expected_ids = statement.value
        relations_dict = self.get_relations_dictionary()
        if expected_relation not in relations_dict:
            return f"Fail: relation not in list: {list(relations_dict.keys())}"
        id_str = ','.join(relations_dict[expected_relation])
        expected_ids.sort()
        expected_id_str = ','.join(expected_ids)
        if (id_str != expected_id_str):
            return f"Fail: {expected_relation}={relations_dict[expected_relation]}"
        return "Pass"

    # 'statement' is a TestStatement object
    def run_reverse_relation_test(self, statement):
        expected_relation = statement.key
        # statement.value is a list of dom_ids representing the nodes that should have
        # a reverse relation back to this node.
        expected_elements = statement.value

        for element in expected_elements:
            test_node = find_node(self.root, element)
            relations_dict = test_node.get_relations_dictionary()

            if expected_relation not in relations_dict:
                return f"Fail: element '{element}' does not have reverse relation, has relations: {list(relations_dict.keys())}"

            if self.dom_id not in relations_dict[expected_relation]:
                return f"Fail: element '{element}' {expected_relation}={relations_dict[expected_relation]}"

        return "Pass"

    # are a sorted list of dom IDs.
    def get_relations_dictionary(self):
        relations_dict = {}
        relations = Atspi.Accessible.get_relation_set(self.node)
        for relation in relations:
            name = relation.get_relation_type().value_name.removeprefix('ATSPI_')
            relations_dict[name] = []
            num_targets = relation.get_n_targets()

            for i in range(num_targets):
                target = relation.get_target(i)
                attributes = Atspi.Accessible.get_attributes(target)
                if "id" in attributes:
                    relations_dict[name].append(attributes["id"])
                else:
                    relations_dict[name].append("[unknown id]")
        return relations_dict

    def get_state_list(self):
        state_list =  Atspi.Accessible.get_state_set(self.node).get_states()
        state_string_list = []
        for state in state_list:
            state_string_list.append(state.value_name.replace('ATSPI_',''))
        return state_string_list


class TestStatement:
    def __init__(self, test_statement_arr):
        self.test_statement_arr = test_statement_arr

        self.type = test_statement_arr[0];
        self.key = test_statement_arr[1];
        self.assertion = test_statement_arr[2];
        self.value = test_statement_arr[3];

    # Returns error or undefined
    def value_compare_with(self, value):
        if self.assertion == 'is':
            if self.value != value:
                return f"Fail: {self.key} is {value}"
        elif self.assertion == 'isNot':
            if self.value == value:
                return f"Fail: {self.key} is {value}"
        else:
            return f"Error: Test statement malformed, '{self.assertion}' must be 'is' or 'isNot'."

        return "Pass"

    # returns error undefined
    def value_contained_or_not_contained_in(self, array):
        if self.assertion == 'contains':
            if self.value not in array:
                return f"Fail: {array} does not contain {self.value}"
        elif self.assertion == 'doesNotContain':
            if self.value in array:
                return f"Fail: {array} contains {self.value}"
        else:
            return f"Error: Test statement malformed, '{self.assertion}' must be 'contains' or 'doesNotContain'."

        return "Pass"
