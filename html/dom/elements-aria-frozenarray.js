var ariaFrozenArray = {
  div: {
    ariaControlsElements: {type: "FrozenArray<T>?", domAttrName: "aria-controls", T: Element},
    ariaDescribedByElements: {type: "FrozenArray<T>?", domAttrName: "aria-describedby", T: Element},
    ariaDetailsElements: {type: "FrozenArray<T>?", domAttrName: "aria-details", T: Element},
    ariaErrorMessageElements: {type: "FrozenArray<T>?", domAttrName: "aria-errormessage", T: Element},
    ariaFlowToElements: {type: "FrozenArray<T>?", domAttrName: "aria-flowto", T: Element},
    ariaLabelledByElements: {type: "FrozenArray<T>?", domAttrName: "aria-labelledby", T: Element},
    ariaOwnsElements: {type: "FrozenArray<T>?", domAttrName: "aria-owns", T: Element},
  },
};

mergeElements(ariaFrozenArray);
