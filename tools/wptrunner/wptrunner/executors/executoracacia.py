import acacia_atspi
import json
from .protocol import (PlatformAccessibilityProtocolPart)

# When running against chrome family browser:
#  self.parent is WebDriverProtocol
#  self.parent.webdriver is webdriver

def findActiveTab(root):
    stack = [root]
    while stack:
        node = stack.pop()

        if node.getRoleName() == 'frame':
            relations = node.getRelations()
            if 'ATSPI_RELATION_EMBEDS' in relations:
                index = relations.index('ATSPI_RELATION_EMBEDS')
                target = node.getTargetForRelationAtIndex(index)
                print(target.getRoleName())
                print(target.getName())
                return target
            continue

        for i in range(node.getChildCount()):
            child = node.getChildAtIndex(i)
            stack.append(child)

    return None

def serialize_node(node):
    node_dictionary = {}
    node_dictionary['role'] = node.getRoleName()
    node_dictionary['name'] = node.getName()
    node_dictionary['description'] = node.getDescription()
    node_dictionary['states'] = sorted(node.getStates())
    node_dictionary['interfaces'] = sorted(node.getInterfaces())
    node_dictionary['attributes'] = sorted(node.getAttributes())

    # TODO: serialize other attributes

    return node_dictionary

def find_node(root, dom_id):
    stack = [root]
    while stack:
        node = stack.pop()

        attributes = node.getAttributes()
        for attribute_pair in attributes:
            [attribute, value] = attribute_pair.split(':', 1)
            if attribute == 'id':
                if value == dom_id:
                    return node

        for i in range(node.getChildCount()):
            child = node.getChildAtIndex(i)
            stack.append(child)

    return None

class AcaciaPlatformAccessibilityProtocolPart(PlatformAccessibilityProtocolPart):
    def setup(self):
        self.product_name = self.parent.product_name
        self.root = None
        self.errormsg = None

        self.root = acacia_atspi.findRootAtspiNodeForName(self.product_name);
        if self.root.isNull():
            error = f"Cannot find root accessibility node for {self.product_name} - did you turn on accessibility?"
            print(error)
            self.errormsg = error


    def get_accessibility_api_node(self, dom_id):
        if self.root.isNull():
            return json.dumps({"role": self.errormsg})

        active_tab = findActiveTab(self.root)

        # This will fail sometimes when accessibilty is off.
        if not active_tab or active_tab.isNull():
            return json.dumps({"role": "couldn't find active tab"})

        # This fails sometimes for unknown reasons.
        node = find_node(active_tab, dom_id)
        if not node or node.isNull():
            return json.dumps({"role": "couldn't find the node with that ID"})

        return json.dumps(serialize_node(node))


