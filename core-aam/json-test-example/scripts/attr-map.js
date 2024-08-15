attrmap = {
  "aria-autocomplete": {
    "Atspi" : [
       [
          "property",
          "objectAttributes",
          "contains",
          "autocomplete:<value>"
       ],
       [
          "property",
          "states",
          "contains",
          "STATE_SUPPORTS_AUTOCOMPLETION"
       ]
    ],
    "IAccessible2" : [
       [
          "property",
          "objectAttributes",
          "contains",
          "autocomplete:<value>"
       ],
       [
          "property",
          "states",
          "contains",
          "IA2_STATE_SUPPORTS_AUTOCOMPLETION"
       ]
    ]
  },
  "aria-braillelabel": {
    "Atspi" : [
       [
          "property",
          "objectAttributes",
          "contains",
          "braillelabel:<value>"
       ]
    ],
    "AXAPI" : [
       [
          "property",
          "AXBrailleLabel",
          "is",
          "<value>"
       ]
    ],
    "IAccessible2" : [
       [
          "property",
          "objectAttributes",
          "contains",
          "braillelabel:<value>"
       ]
    ],
    "UIA" : [
       [
          "property",
          "AriaProperties.braillelabel",
          "is",
          "<value>"
       ]
    ]
  },
  "aria-errormessage": {
    "Atspi" : [
       [
          "relation",
          "RELATION_ERROR_MESSAGE",
          "is",
          "<id-list>"
       ],
       [
          "reverseRelation",
          "RELATION_ERROR_FOR",
          "is",
          "<id-list>"
       ]

    ],
    "AXAPI" : [
       [
          "property",
          "AXErrorMessageElements",
          "is",
          "<id-list>"
       ]
    ],
    "IAccessible2" : [
       [
          "relation",
          "IA2_RELATION_ERROR",
          "is",
          "<id-list>"
       ],
       [
          "reverseRelation",
          "IA2_RELATION_ERROR_FOR",
          "is",
          "<is-list>"
       ]

    ],
    "UIA" : [
       [
          "property",
          "ControllerFor",
          "is",
          "<id-list>"
       ]
    ]
  }
}
