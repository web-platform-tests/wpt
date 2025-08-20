var divElement = {
  div: {
    ariaAtomic: {type: "enum", keywords: ["true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "false", defaultVal: null},
    ariaAutoComplete: {type: "enum", keywords: ["inline", "list", "both", "none"], isNullable: true, invalidVal: "none", defaultVal: "none"},
    ariaBusy: {type: "enum", keywords: ["true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "false", defaultVal: "false"},
    ariaChecked: {type: "enum", keywords: ["true", "false", "mixed"], nonCanon:{"": null}, isNullable: true, invalidVal: null, defaultVal: null},
    ariaCurrent: {type: "enum", keywords: ["page", "step", "location", "date", "time", "true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "true", defaultVal: "false"},
    ariaDisabled: {type: "enum", keywords: ["true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "false", defaultVal: "false"},
    ariaExpanded: {type: "enum", keywords: ["true", "false"], nonCanon:{"": null}, isNullable: true, invalidVal: null, defaultVal: null},
    ariaHasPopup: {type: "enum", keywords: ["true", "false", "menu", "dialog", "listbox", "tree", "grid"], isNullable: true, invalidVal: "false", defaultVal: null},
    ariaHidden: {type: "enum", keywords: ["true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "false", defaultVal: "false"},
    ariaInvalid: {type: "enum", keywords: ["true", "false", "spelling", "grammar"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "true", defaultVal: "false"},
    ariaLive: {type: "enum", keywords: ["polite", "assertive", "off"], isNullable: true, invalidVal: "off", defaultVal: "off"},
    ariaModal: {type: "enum", keywords: ["true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "false", defaultVal: "false"},
    ariaMultiLine: {type: "enum", keywords: ["true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "false", defaultVal: "false"},
    ariaMultiSelectable: {type: "enum", keywords: ["true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "false", defaultVal: "false"},
    ariaOrientation: {type: "enum", keywords: ["horizontal", "vertical"], nonCanon:{"": null}, isNullable: true, invalidVal: null, defaultVal: null},
    ariaPressed: {type: "enum", keywords: ["true", "false", "mixed"], nonCanon:{"": null}, isNullable: true, invalidVal: null, defaultVal: null},
    ariaReadOnly: {type: "enum", keywords: ["true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "false", defaultVal: "false"},
    ariaRequired: {type: "enum", keywords: ["true", "false"], nonCanon:{"": "false"}, isNullable: true, invalidVal: "false", defaultVal: "false"},
    ariaSelected: {type: "enum", keywords: ["true", "false"], nonCanon:{"": null}, isNullable: true, invalidVal: null, defaultVal: null},
    ariaSort: {type: "enum", keywords: ["ascending", "descending", "other", "none"], isNullable: true, invalidVal: "none", defaultVal: "none"},
  },
};

mergeElements(divElement);
