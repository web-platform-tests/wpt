(function DOMParsingAndSerializationPF(global) {
   "use strict";
   // The Polyfill for DOM Parser.

   var XMLNS = "http://www.w3.org/XML/1998/namespace";
   var XMLNSNS = "http://www.w3.org/2000/xmlns/";
   var HTMLNS = "http://www.w3.org/1999/xhtml";

   var voidElementMap = {
      "area":1,
      "base":1,
      "basefont":1,
      "bgsound":1,
      "br":1,
      "col":1,
      "embed":1,
      "frame":1,
      "hr":1,
      "img":1,
      "input":1,
      "keygen":1,
      "link":1,
      "menuitem":1,
      "meta":1,
      "param":1,
      "source":1,
      "track":1,
      "wbr":1
   };

   function fragmentSerializationAlgorithm(node, requireWellFormed) {
      var contextDocument = node.ownerDocument;
      var isHTML = contextDocument instanceof HTMLDocument;
      if (isHTML)
         throw new Error("Not implemented");
      else
         return xmlSerialization(node, requireWellFormed);
   }

   function xmlSerialization(node, requireWellFormed) {
      // 1.Let context namespace be null. The context namespace is changed when a node serializes
      //   a different default namespace definition from its parent. The algorithm assumes no
      //   namespace to start.
      var contextNamespace = null;
      // 2.(EDITED)Let namespace prefix map be a new map for associating namespaceURI and **namespace
      //   prefix lists**, where namespaceURI values are the map's **unique** keys **(which may include the null 
      //   value representing no namespace)**, and **ordered lists of associated** prefix values are 
      //   the map's key values. The namespace prefix map will be populated by previously seen 
      //   namespaceURIs and **all their previously encountered** prefix associations **in** a subtree.
      //   **Note: the last seen prefix for a given namespaceURI is at the end of its respective list.
      //   The list is searched to find potentially matching prefixes, and if no matches are found for 
      //   the given namespaceURI, then the last prefix in the list is used. See 'copy a namespace prefix 
      //   map' and 'retrieve a prefix string from the namespace prefix map' for additional details.**
      var namespacePrefixMap = new NamespacePrefixMap();
      // 3.(EDITED)'Add' the XML namespace with prefix string "xml" to the new namespace prefix map.
      namespacePrefixMap.add(XMLNS, "xml");
      // 4.Let generated namespace prefix index be an integer with a value of 1. The generated
      //   namespace prefix index is used to generate a new unique prefix value when no suitable
      //   existing namespace prefix is available to serialize a node's namespaceURI (or the
      //   namespaceURI of one of node's attributes). See the generate a prefix algorithm.
      var generatedNamespacePrefixRef = [1];
      // 5.Return the result of running the XML serialization algorithm on node passing the context
      //   namespace, namespace prefix map, generated namespace prefix index reference, and the flag
      //   require well-formed. If an exception occurs during the execution of the algorithm, then
      //   catch that exception and throw a DOMException with name "InvalidStateError".
      try {
         return xmlSerializationAlgorithm(node, contextNamespace, namespacePrefixMap, generatedNamespacePrefixRef, requireWellFormed);
      }
      catch (ex) {
         throw Error("DOMException, InvalidStateError");
      }
   }

   function xmlSerializationAlgorithm(node, contextNamespace, namespacePrefixMap, generatedNamespacePrefixRef, requireWellFormed) {
      if (node instanceof Element)
         return serializeElement(node, contextNamespace, namespacePrefixMap, generatedNamespacePrefixRef, requireWellFormed);
      else if (node instanceof Document)
         return serializeDocument(node, contextNamespace, namespacePrefixMap, generatedNamespacePrefixRef, requireWellFormed);
      else if (node instanceof Comment)
         return serializeComment(node, requireWellFormed);
      else if (node instanceof Text)
         return serializeText(node, requireWellFormed);
      else if (node instanceof DocumentFragment)
         return serializeDocumentFragment(node, contextNamespace, namespacePrefixMap, generatedNamespacePrefixRef, requireWellFormed);
      else if (node instanceof DocumentType)
         // Run the steps to produce a DocumentType serialization of node given the require well-formed
         // flag, and return the string this produced.
         return serializeDocumentType(node, requireWellFormed);
      else if (node instanceof ProcessingInstruction)
         return serializeProcessingInstruction(node, requireWellFormed);
      else
         // CDATA?
         throw new Error("Type unrecognized!");
   }

   function serializeElement(node, namespace, prefixMap, prefixIndexRef, requireWellFormed) {
      // 1. If the require well-formed flag is set (its value is true), and this node's localName
      //    attribute contains the character ":" (U+003A COLON) or does not match the XML Name
      //    production [XML10], then throw an exception; the serialization of this node would not
      //    be a well-formed element.
      if (requireWellFormed && ((node.localName.indexOf(":") >= 0) || !matchXMLNameProduction(node.localName)))
         throw new Error("Failed validation: contained ':' char or failed name validation.");
      // 2. Let markup be the string "<" (U+003C LESS-THAN SIGN).
      var markup = "<";
      // 3.Let qualified name be an empty string.
      var qualifiedName = "";
      // 4.Let a skip end tag flag have the value false.
      var skipEndTag = false;
      // 5.Let an ignore namespace definition attribute flag have the value false.
      var ignoreNamespaceDefinition = false;
      // 6.(EDITED) Let map be a 'copy of the prefix map'.
      var map = new NamespacePrefixMap(prefixMap);
      // 7.(EDITED)Let **local prefixes map be an empty map. The map has unique prefix strings as its
      //   keys, with a corresponding namespace as the key's value (in this map, the null namespace is represented by the empty string). 
      //   Note: This map is local to each element.
      //   Its purpose is to ensure that there are no conflicting prefixes should a new namespace
      //   prefix attribute need to be generated. It is also used to enable skipping of duplicate
      //   prefix definitions when writing an element's attributes: the map allows the algorithm 
      //   to distinguish between a prefix in the namespace prefix map that might be locally defined 
      //   (to the current element) and one that is not.**
      var localPrefixesMap = {};
      // 8.(DELETED)Let duplicate prefix definition be null.
      // 9.(EDITED)Let local default namespace be the result of recording the namespace information for
      //   node given map, and local prefixes map.
      var localDefaultNamespace = recordTheNamespaceInfo(node, map, localPrefixesMap);
      // 10.Let inherited ns be a copy of namespace.
      var inheritedNS = (namespace == null) ? null : (new String(namespace)).valueOf();
      // 11.Let ns be the value of node's namespaceURI attribute.
      var ns = node.namespaceURI;
      // 12.If inherited ns is equal to ns, then:
      if (inheritedNS == ns) {
         // 1.If local default namespace is not null, then set ignore namespace definition attribute to true.
         if (localDefaultNamespace != null)
            ignoreNamespaceDefinition = true;
         // 2.If ns is the XML namespace, then let qualified name be the concatenation of the string "xml:"
         //   and the value of node's localName.
         if (ns == XMLNS)
            qualifiedName = "xml:" + node.localName;
         // 3.Otherwise, let qualified name be the value of node's localName. The node's prefix is always dropped.
         else
            qualifiedName = node.localName;
         // 4.Append the value of qualified name to markup.
         markup += qualifiedName;
      }
      // 13.Otherwise, inherited ns is not equal to ns (the node's own namespace is different from the context
      //    namespace of its parent). Run these sub-steps:
      else {
         // 1.Let prefix be the value of node's prefix attribute.
         var prefix = node.prefix;
         // 2.(EDITED)Let candidate prefix be the result of 'retrieving a prefix from map' given namespace 'ns'
         //   with preferred 'prefix'. NOTE: This may return null if no namespace key 'ns' exists in the map.
         var candidatePrefix = map.get(ns, prefix);
         // **** BUG: Additional validation needed--can't re-parse an element that has an XMLNS prefix--no go. If conforming flag set, then fail
         // (NEW)1.5. If the value of prefix matches "xmlns", then run the following steps:
         if (prefix == "xmlns") {
            // (NEW from above)1.If the require well-formed flag is set, then throw an error. The element with 
            // prefix "xmlns" will not legally round-trip in a conforming XML parser.
            if (requireWellFormed)
               throw new Error("Failed validation: elements with xmlns prefixes are not valid XML");
            // *** BUG: this is to match implementations that serialize the element with an un-qualified xmlns prefix!
            // (NEW)2.Let candidate prefix be the value of prefix
            candidatePrefix = prefix;
         }
         // 3.If candidate prefix is not null (a suitable namespace prefix is defined which maps to ns), then:
         if (candidatePrefix != null) {
            // ****NOTE**** this blindly overrides the existing element's prefix if it already had one. However,
            //   retrieving the prefix from the map previously tries to match the existing prefix if possible.
            // 1.Let qualified name be the concatenation of candidate prefix, ":" (U+003A COLON), and node's
            //   localName. There exists on this node or the node's ancestry a namespace prefix definition that
            //   defines the node's namespace.
            qualifiedName = candidatePrefix + ":" + node.localName;
            // 2.(ORIGINAL) If local default namespace is not null (there exists a locally-defined default namespace
            //   declaration attribute), then let inherited ns get the value of ns.
            // 2.(FIXED) If the local default namespace is not null (there exists a locally-defined default namespace
            //   declaration attribute), **and its value is not the XML namespace***, then let inherited ns get the value of 
            //   local default namespace unless the local default namespace is the empty string in which case let it get null. 
            //   (inherit down the declared default, rather than this node's namespace). Note: any default namespace 
            //   definitions or namespace prefixes that attempt to use the XML namespace are omitted when serializing this
            //   node's attributes.
            if ((localDefaultNamespace != null) && (localDefaultNamespace != XMLNS))
              inheritedNS = (localDefaultNamespace == "") ? null : localDefaultNamespace;
            // 3.Append the value of qualified name to markup.
            markup += qualifiedName;
         }
         // NOTE: This is the "use the given prefix in serialization" branch... By this step, there's no 
         // namespace/prefix mapping declaration in this node (or any parent node) that could be used (or
         // step 3 above would have handled it). However, there might be a duplicate prefix name (with a 
         // different namespace present on this node, which would be a conflict...)
         // *** Bug: Was missing utilization of the node's prefix when the node *also* had a default namespace!
         // (ORIGINAL)4.Otherwise, if prefix is not null and local default namespace is null, then:
         // (FIXED)4.Otherwise, if prefix is not null, then:
         else if (prefix != null) {
            // 1.(EDITED)If the local prefixes map contains a key matching prefix, then let prefix be the result of
            //   generating a prefix providing as input the namespace prefix map map, node's ns string, and
            //   the prefix index integer.
            if (localPrefixesMap.hasOwnProperty(prefix))
               prefix = generateAPrefix(map, ns, prefixIndexRef);
            // 2.(EDITED) 'add' 'prefix' to map given namespace 'ns'
            map.add(ns, prefix);
            // 3.Let qualified name be the concatenation of prefix, ":" (U+003A COLON), and node's localName.
            qualifiedName = prefix + ":" + node.localName;
            // 4.Append the value of qualified name to markup.
            markup += qualifiedName;
            // 5.Append the following to markup, in the order listed: The following serializes the new
            //   namespace/prefix association just added to the map.
            //   1." " (U+0020 SPACE);
            markup += " ";
            //   2.The string "xmlns:";
            markup += "xmlns:";
            //   3.The value of prefix;
            markup += prefix;
            //   4."="" (U+003D EQUALS SIGN, U+0022 QUOTATION MARK);
            markup += "=\"";
            //   5.The result of serializing an attribute value given ns and the require well-formed flag as input;
            markup += serializeAnAttributeValue(ns, requireWellFormed);
            //   6.""" (U+0022 QUOTATION MARK).
            markup += "\"";
            // *** See bug at beginning of this conditional block--need to handle the default decl if present...(no
            //     need to handle the XMLNS case as in case 3, since XMLNS is always in the map, thus it will always trigger
            //     branch 3 above.) Also, it doesn't matter what the local default namespace is (e.g., whether it matches ns), 
            //     since the prefix will trump in determing the node's namespace.
            // 6.(NEW) If local default namespace is not null (there exists a locally-defined default namespace
            //   declaration attribute), then let inherited ns get the value of local default namespace unless the local 
            //   default namespace is the empty string in which case let it get null.
            if (localDefaultNamespace != null)
               inheritedNS = (localDefaultNamespace == "") ? null : localDefaultNamespace;
         }
         // At this point, the namespace for this node still needs to be defined, but there's no prefix (or candidate
         // prefix) to help. The next try uses the default namespace declaration to do this--optionally replacing an
         // existing default declaration if present.
         // 5.Otherwise, if local default namespace is null, or local default namespace is not null and its
         //   value is not equal to ns, then:
         else if (localDefaultNamespace == null || ((localDefaultNamespace != null) && localDefaultNamespace != ns)) {
            // 1.Set the ignore namespace definition attribute flag to true.
            ignoreNamespaceDefinition = true;
            // 2.Let qualified name be the value of node's localName.
            qualifiedName = node.localName;
            // 3.Let the value of inherited ns be ns. The new default namespace will be used in the serialization to
            //   define this node's namespace and act as the context namespace for its children.
            inheritedNS = ns;
            // 4.Append the value of qualified name to markup.
            markup += qualifiedName;
            // 5.Append the following to markup, in the order listed: The following serializes the new (or
            //   replacement) default namespace definition.
            //   1." " (U+0020 SPACE);
            markup += " ";
            //   2.The string "xmlns";
            markup += "xmlns";
            //   3."="" (U+003D EQUALS SIGN, U+0022 QUOTATION MARK);
            markup += "=\"";
            //   4.The result of serializing an attribute value given ns and the require well-formed flag as input;
            markup += serializeAnAttributeValue(ns, requireWellFormed);
            //   5.""" (U+0022 QUOTATION MARK).
            markup += "\"";
         }
         // 6.Otherwise, the node has a local default namespace that matches ns. Let qualified name be the value of
         //   node's localName, let the value of inherited ns be ns, and append the value of qualified name to markup.
         else {
            qualifiedName = node.localName
            inheritedNS = ns;
            markup += qualifiedName;
         }
      } // BUG** pass the well-formed flag along!
      // 14.(EDITED)Append to markup the result of the XML serialization of node's attributes given the namespace
      //    prefix map map, the generated prefix index prefix index, **the local prefixes map**, and the flag 
      //    ignore namespace definition attribute.
      markup += xmlSerializationOfNodeAttributes(node, map, prefixIndexRef, localPrefixesMap, ignoreNamespaceDefinition);
      // 15.If ns is the HTML namespace, and the node's list of children is empty, and the node's localName
      //    matches any one of the following void elements: "area", "base", "basefont", "bgsound", "br",
      //    "col", "embed", "frame", "hr", "img", "input", "keygen", "link", "menuitem", "meta", "param",
      //    "source", "track", "wbr"; then append the following to markup, in the order listed:
      if ((ns == HTMLNS) && (node.childNodes.length == 0) && voidElementMap[node.localName]) {
         // 1." " (U+0020 SPACE);
         markup += " ";
         // 2."/" (U+002F SOLIDUS).
         markup += "/";
         // and set the skip end tag flag to true.
         skipEndTag = true;
      }
      // 16.If ns is not the HTML namespace, and the node's list of children is empty, then append "/"
      //    (U+002F SOLIDUS) to markup and set the skip end tag flag to true.
      if ((ns != HTMLNS) && (node.childNodes.length == 0)) {
         markup += "/";
         skipEndTag = true;
      }
      // 17.Append ">" (U+003E GREATER-THAN SIGN) to markup.
      markup += ">";
      // 18.If the value of skip end tag is true, then return the value of markup and skip the remaining
      //    steps. The node is a leaf-node.
      if (skipEndTag)
         return markup;
      // 19.If ns is the HTML namespace, and the node's localName matches the string "template", then
      //    this is a template element. Append to markup the result of running the XML serialization
      //    algorithm on the template element's template contents (a DocumentFragment), providing the
      //    value of inherited ns for the context namespace, map for the namespace prefix map, prefix
      //    index for the generated namespace prefix index, and the value of the require well-formed
      //    flag. This allows template content to round-trip , given the rules for parsing XHTML
      //    documents [HTML5].
      if ((ns == HTMLNS) && (node.localName == "template"))
         markup += xmlSerializationAlgorithm(node. inheritedNS, map, prefixIndexRef, requireWellFormed);
      // 20.Otherwise, append to markup the result of running the XML serialization algorithm on each
      //    of node's children, in tree order, providing the value of inherited ns for the context
      //    namespace, map for the namespace prefix map, prefix index for the generated namespace prefix
      //    index, and the value of the require well-formed flag.
      else
         [].slice.call(node.childNodes).forEach(function xmlSerializationOfChildNodes(child) {
            markup += xmlSerializationAlgorithm(child, inheritedNS, map, prefixIndexRef, requireWellFormed);
         });
      // 21.Append the following to markup, in the order listed:
      //    1."</" (U+003C LESS-THAN SIGN, U+002F SOLIDUS);
      markup += "</";
      //    2.The value of qualified name;
      markup += qualifiedName;
      //    3.">" (U+003E GREATER-THAN SIGN).
      markup += ">";
      // 22.Return the value of markup.
      return markup;
   }

   //(EDITED)
   // This [below] step[s] will update the namespace prefixes map with any found namespace prefix definitions, add the found
   // prefix definitions to the local prefixes map,
   // and return a local default namespace value defined by a default namespace attribute if one exists.
   // Otherwise it returns null.
   function recordTheNamespaceInfo(element, map, localPrefixesMap) {
      // 1.Let default namespace attr value be null.
      var defaultNamespaceAttrValue = null;
      // Main: For each attribute attr in element's attributes, in the order they are specified in
      //       the element's attribute list:
      [].slice.call(element.attributes).forEach(function recordTheNamespaceInfoMainLoop(attr) {
         // 1.Let attribute namespace be the value of attr's namespaceURI value.
         var attributeNamespace = attr.namespaceURI;
         // 2.Let attribute prefix be the value of attr's prefix.
         var attributePrefix = attr.prefix;
         // 3.If the attribute namespace is the XMLNS namespace, then:
         if (attributeNamespace == XMLNSNS) {
            // 1.If attribute prefix is null, then attr is a default namespace declaration. Set the
            //   default namespace attr value to attr's value and stop running these steps, returning
            //   to Main to visit the next attribute.
            if (attributePrefix == null)
               return defaultNamespaceAttrValue = attr.value
            // 2.Otherwise, the attribute prefix is not null and attr is a namespace prefix definition.
            //   Run the following steps:
            // 1.Let prefix definition be the value of attr's localName.
            var prefixDefinition = attr.localName;
            // 2.Let namespace definition be the value of attr's value.
            var namespaceDefinition = attr.value;
            // **Note: XML namespace definitions in prefixes are completely ignored (in order to avoid unnecessary 
            // work when there might be prefix conflicts). XML namespaced elements are always handled uniformly by 
            // prefixing (and overriding if necessary) the element's localname with the reserved 'xml' prefix.
            // 2.1.(NEW)If namespace definition is the XML namespace, then stop running these steps,
            //   and return to Main to visit the next attribute.
            if (namespaceDefinition == XMLNS)
              return;
            // **bug** empty strings were originally recorded here, but this is compared against actual 
            // namespaceURI later, which will be null. Need to normalize...
            // 2.5.(NEW)If namespace definition is the empty string (the declarative form of resetting back 
            //     to no namespace), then let namespace definition be null instead.
            if (namespaceDefinition == "")
              namespaceDefinition = null;
            // **Note: Avoid adding duplicate prefix definitions for the same namespace in the map. Has the 
            //   side-effect of avoiding serializaing duplicate namespace prefix declarations at different
            //   levels in a serialized node tree.
            // 2.6.(NEW)If 'prefix definition' is 'found' in map given the namespace 'namespace definition', then
            //   stop running these steps, and return to Main to visit the next attribute.
            if (map.has(namespaceDefinition, prefixDefinition))
                return;
            // **Point-of-interest Now I can avoid special-casing previous XMLNS bug fixes below: such as having 
            // the XML prefix get overridden in the map
            // 3.(DELETED)If a key matching the value of namespace definition already exists in map, and the key's
            //   value matches prefix definition, then this is a duplicate namespace prefix definition.
            //   Set the value of duplicate prefix definition to prefix definition. **Note: it's OK for the list to have dups, in fact, it matches Firefox's prefix selection behavior.
            // 4.(EDITED)'Add' the prefix 'prefix definition' to map given namespace 'namespace definition'.
            map.add(namespaceDefinition, prefixDefinition);
            // 5.(DELETED)--Otherwise, no key matching the value of namespace definition exists; append to map a new
            //   key namespace definition whose key value is the prefix definition.--
            // 6.(EDITED) Add the value of prefix definition as a new key to the local prefixes map, 
            //   with the namespace definition as the key's value **replacing the value of null with the 
            //   empty string**.
            localPrefixesMap[prefixDefinition] = (namespaceDefinition == null ? "" : namespaceDefinition);
         }
      });
      // 3.Return the value of default namespace attr value.
      return defaultNamespaceAttrValue; // NOTE: The empty string is a legitimate return value and is not converted to null.
   }

   //(NEW)
   // To 'copy a namespace prefix map' map means to copy the map's keys into a new empty namespace prefix map, and 
   // to copy each of the values in the list of prefixes associated with each keys' value into a new list which
   // should be associated with the respective key in the new map.
   function NamespacePrefixMap(mapToCopy) {
      if (mapToCopy) {
        var that = this;
        Object.keys(mapToCopy).forEach(function (key) {
          that[key] = mapToCopy[key].slice(0); // key will be an array (slice(0) copies it's contents into a new array)
        });
      }
   }
   //(NEW)**Note: This is abstracted to support the newly-enchanced namespace prefix map**
   // To 'retrieve a preferred prefix string 'prefix' from the namespace prefix map map' given a namespace 'ns', 
   // the user agent should:
   NamespacePrefixMap.prototype.get = function(ns, preferred) {    
      // 1. Let candidates list be the result of retrieving a list from map where there exists a key in map that 
      //    matches the value of ns or if there is no such key, then stop running these steps, and return the null 
      //    value.
      var candidatesList = this[ns];
      if (!candidatesList)
        return null;
      // NOTE: There will always be at least one prefix value in the list.
      // 2. Otherwise, for each prefix value prefix in candidates list, iterating from beginning to end:
      return candidatesList.find(function (prefix, i) {
        // 1. If prefix matches preferred, then stop running these steps and return prefix.
        if (prefix == preferred)
          return true;
        // 2. If prefix is the last item in the candidates list, then stop running these steps and return prefix.
        if (i == (candidatesList.length - 1))
          return true;
      });
   }
   //(NEW)
   // To 'check if a prefix string 'prefix' is 'found' in a namespace prefix map 'map' given a namespace 'ns', the user
   // agent should:
   NamespacePrefixMap.prototype.has = function (ns, prefix) {
      // 1. Let candidates list be the result of retrieving a list from map where there exists a key in map that 
      //    matches the value of ns or if there is no such key, then stop running these steps, and return false.
      var candidatesList = this[ns];
      if (!candidatesList)
        return false;
      // 2. If the value of 'prefix' occurs at least once in candidatesList, return true, otherwise return false.
      if (candidatesList.indexOf(prefix) >= 0)
        return true;
      else
        return false;
   }
   //(NEW)
   // To 'add a prefix string 'prefix' to the namespace prefix map map' given a namespace 'ns', the user agent should:
   NamespacePrefixMap.prototype.add = function(ns, prefix) {
      // 1. Let candidates list be the result of retrieving a list from map where there exists a key in map that 
      //    matches the value of ns or if there is no such key, then let candidates list be null.
      var candidatesList = this[ns];
      // 2. If candidates list is null, then create a new list with prefix as the only item in the list, and 
      //    associate that list with a new key ns in map.
      if (!candidatesList)
        this[ns] = [prefix];
      // 3. Otherwise, append prefix to the end of candidates list.
      // NOTE: This corresponds to 'last-seen' selection when searching the list for a matching prefix in the
      // 'retrieve a prefix string from the namespace prefix map' steps. This list may contain duplicates of the 
      // same prefix value seen earlier (and that's OK).
      else
        this[ns].push(prefix);
   }
   
   // To generate a prefix given a namespace prefix map map, a string new namespace, and a reference to a
   // generated namespace prefix index prefix index, the user agent must run the following steps:
   function generateAPrefix(map, newNamespace, prefixIndexRef) {
      // 1.Let generated prefix be the concatenation of the string "ns" and the current numerical value
      //   of prefix index.
      var generatedPrefix = "ns" + prefixIndexRef[0];
      // 2.Let the value of prefix index be incremented by one.
      prefixIndexRef[0]++;
      // 3.(EDITED)'Add' to map the 'generated prefix' given the 'new namespace' namespace.
      map.add(newNamespace, generatedPrefix);
      // 4.Return the value of generated prefix.
      return generatedPrefix;
   }

   // To serialize an attribute value given an attribute value and require well-formed flag, the user
   // agent must run the following steps:
   function serializeAnAttributeValue(attributeValue, requireWellFormed) {
      // 1.If the require well-formed flag is set (its value is true), and attribute value contains
      //   characters that are not matched by the XML Char production [XML10], then throw an exception;
      //   the serialization of this attribute value would fail to produce a well-formed element
      //   serialization.
      if (requireWellFormed && !matchXMLCharProduction(attributeValue))
         throw Error("Contains bad characters");
      // 2.If attribute value is null, then return the empty string.
      if (attributeValue == null)
         return "";
      // 3.Otherwise, attribute value is a string. Return the value of attribute value, first replacing
      //   any occurrences of the following:
      //   1."&" with "&amp;"
      attributeValue = attributeValue.replace("&", "&amp;");
      //   2.""" with "&quot;"
      attributeValue = attributeValue.replace("\"", "&quot;");
      //   3."<" with "&lt;"
      attributeValue = attributeValue.replace("<", "&lt;");
      //   4.">" with "&gt;"
      attributeValue = attributeValue.replace(">", "&gt;");
      return attributeValue;
   }

   // **BUG the duplicatePrefixDefinition thing didn't work before as specified. Using the map instead to de-dup. Results in one less param to this method...
   //(EDITED) The XML serialization of the attributes of an Element element together with a namespace prefix
   // map map, a generated prefix index prefix index reference, a local prefixes map, a flag ignore namespace definition
   // attribute, and a flag require well-formed, is the result of the following algorithm:
   // **BUG BUG: last param not passed by caller in spec!!
   function xmlSerializationOfNodeAttributes(element, map, prefixIndexRef, localPrefixesMap, ignoreNamespaceDefinition, requireWellFormed) {
      // 1.Let result be the empty string.
      var result = "";
      // 2.Let localname set be a new empty namespace localname set. This localname set will contain
      //   tuples of unique attribute namespaceURI and localName pairs, and is populated as each attr
      //   is processed. This set is used to [optionally] enforce the well-formed constraint that an
      //   element cannot have two attributes with the same namespaceURI and localName. This can occur
      //   when two otherwise identical attributes on the same element differ only by their prefix values.
      var localnameSet = new NamespaceLocalNameSet();
      // Main: For each attribute attr in element's attributes, in the order they are specified in the element's attribute list:
      [].slice.call(element.attributes).forEach(function xmlSerializationOfNodeAttributesMainLoop(attr) {
         // 1.If the require well-formed flag is set (its value is true), and the localname set contains
         //   a tuple whose values match those of a new tuple consisting of attr's namespaceURI attribute
         //   and localName attribute, then throw an exception; the serialization of this attr would fail
         //   to produce a well-formed element serialization.
         if (requireWellFormed && localnameSet.has(attr.namespaceURI, attr.localName))
            throw new Error("Duplicate namespace/localName attr found");
         // 2.Create a new tuple consisting of attr's namespaceURI attribute and localName attribute, and
         //   add it to the localname set.
         localnameSet.set(attr.namespaceURI, attr.localName);
         // 3.Let attribute namespace be the value of attr's namespaceURI value.
         var attributeNamespace = attr.namespaceURI;
         // 4.Let candidate prefix be null.
         var candidatePrefix = null;
         // 5.If attribute namespace is not null, then run these sub-steps:
         if (attributeNamespace != null) {
            // *** Refactor: There were a number of clauses related to XMLNS namespace that should be handled together.
            // (ORIGINAL)2.Otherwise, if there exists a key in map that matches the value of attribute namespace,
            //   then let candidate prefix be that key's value from the map.
            // (REFACTORED/EDITED)1.Let candidate prefix be the result of 'retrieving' a prefix from 'map' given 
            //   namespace 'attribute namespace' and with preferred prefix being the value of attr's 'prefix' value. 
            candidatePrefix = map.get(attributeNamespace, attr.prefix);
            // *** Refactor: moved this from step 1 to step 2, and now provides steps:
            // (ORIGINAL)1.If the value of attribute namespace is the XMLNS namespace and either the attr's prefix
            //   is null and the ignore namespace definition attribute flag is true or the attr's prefix
            //   is not null and the attr's localName matches the value of duplicate prefix definition,
            //   then stop running these steps and goto Main to visit the next attribute.
            // (REFACTORED)2.If the value of attribute namespace is the XMLNS namespace, then run these steps:
            if (attributeNamespace == XMLNSNS) {
               // **NOTE: the XML namespace cannot be redeclared and survive round-tripping (unless it defines the prefix 'xml')
               // to side-step the problem, this serializer always prefixes XML namespaced elements with 'xml' and drops
               // any related definitions.
               // (REFACTORED/ORIGINAL)1.If either the attr's prefix is null and the ignore namespace definition attribute flag 
               //    is true or the attr's prefix is not null and the attr's localName matches the value of 
               //    duplicate prefix definition, then stop running these steps and goto Main to visit the next attribute.
               // (REFACTORED/FIXED/EDITED)1.If any of the following are true, then stop running these steps and goto Main to 
               //    visit the next attribute: 
               //    * the attr's value is the XML namespace;
               //    * the attr's prefix is null and the ignore namespace definition attribute flag is true (the element's default 
               //      namespace attribute should be skipped); 
               //    * the attr's prefix is not null and either the attr's localName is not a key contained in the local prefixes map, or it
               //      is present but the value of the key does not match attr's value, and furthermore that the attr's localName 
               //      as prefix is 'found' in the namespace prefix map when given the namespace consisting of the attr's value
               //      (the current namespace prefix definition was exactly defined previously--on an ancestor element not the current element
               //      whose attributes are being processed).
               if ((attr.value == XMLNS) ||
                   ((attr.prefix == null) && ignoreNamespaceDefinition) ||
                   ((attr.prefix != null) && 
                      (!localPrefixesMap.hasOwnProperty(attr.localName) || (localPrefixesMap[attr.localName] != attr.value)) && 
                      map.has(attr.value, attr.localName)))
                  return;
               // **** BUG: Hadn't realized that under legit XML parsing rules, you aren't allowed to parse an element into the XMLNS namespace
               //  in any way. The following clause prevents this behind a well-formed check.
               // (NEW)2.If the requireWellFormed flag is set (its value is true), and the value of attr's value attribute matches the XMLNS namespace,
               //    then throw an exception; the serialization of this attribute would produce invalid XML because the XMLNS namespace is
               //    reserved and cannot be applied as an element's namespace via XML parsing. Note: DOM APIs do allow creation of elements in the 
               //    XMLNS namespace under strict qualifications.)
               if (requireWellFormed && (attr.value == XMLNSNS))
                  throw new Error("XMLNS namespace is reserved and cannot be used to redefine a prefix or apply an element namespace default.");
               // *** Validation problem: prefix definitions cannot declare or "unset" a namespace by providing the empty string (would provide a failure on parsing)
               // (NEW)3.A.If the required well-formed flag is set (its value is true), and the value of attr's value attribute is the empty string,
               //          then throw an exception; namespace prefix declarations cannot be used to undeclare a namespace (use a default namespace declaration instead).
               if (requireWellFormed && (attr.value == ""))
                  throw new Error("Namespace prefix definitions cannot be used to un-set a namespace using a prefix.")
               // **** BUG: we miss adding the "xmlns" prefix to prefix definitions (in general)! We add a clause to handle that:
               // (NEW)4. If the attr's prefix matches the string "xmlns", then let candidate prefix be the string "xmlns".
               if (attr.prefix == "xmlns")
                  candidatePrefix = "xmlns";
            }
            // **** BUG: need to allow non-ignored default namespace decls of XMLNS to skip out of this if scope and be serialized as-is.
            // 3.(ORIGINAL)Otherwise, there is no key matching attribute namespace in map and the attribute
            //   namespace is not the XMLNS namespace. Run these steps:
            // 3.(CLARIFIED, POST Refactor)Otherwise, the attribute namespace is not the XMLNS namespace. Run these steps:
            else {
               // 1.Let candidate prefix be the result of generating a prefix providing map, attribute
               //   namespace, and prefix index as input.
               candidatePrefix = generateAPrefix(map, attributeNamespace, prefixIndexRef);
               // 2.Append the following to result, in the order listed:
               //   1." " (U+0020 SPACE);
               result += " ";
               //   2.The string "xmlns:";
               result += "xmlns:";
               //   3.The value of candidate prefix;
               result += candidatePrefix;
               //   4."="" (U+003D EQUALS SIGN, U+0022 QUOTATION MARK);
               result += "=\"";
               //   5.The result of serializing an attribute value given attribute namespace and the
               //     require well-formed flag as input;
               result += serializeAnAttributeValue(attributeNamespace, requireWellFormed);
               //   6.""" (U+0022 QUOTATION MARK).
               result += "\"";
            }
         }
         // 6.Append a " " (U+0020 SPACE) to result.
         result += " ";
         // 7.If candidate prefix is not null, then append to result the concatenation of candidate
         //   prefix with ":" (U+003A COLON).
         if (candidatePrefix != null)
            result += (candidatePrefix + ":");
         // 8.If the require well-formed flag is set (its value is true), and this attr's localName
         //   attribute contains the character ":" (U+003A COLON) or does not match the XML Name
         //   production [XML10] or equals "xmlns" and attribute namespace is null, then throw an
         //   exception; the serialization of this attr would not be a well-formed attribute.
         if (requireWellFormed && (
            (attr.localName.indexOf(":") >= 0) ||
             !matchXMLNameProduction(attr.localName) ||
             ((attr.localName == "xmlns") && (attributeNamespace == null))
            ))
            throw new Error("Would not be well formed");
         // 9.Append the following strings to result, in the order listed:
         //   1.The value of attr's localName;
         result += attr.localName;
         //   2."="" (U+003D EQUALS SIGN, U+0022 QUOTATION MARK);
         result += "=\"";
         //   3.The result of serializing an attribute value given attr's value attribute and the require well-formed flag as input;
         result += serializeAnAttributeValue(attr.value, requireWellFormed);
         //   4.""" (U+0022 QUOTATION MARK).
         result += "\"";
      });
      // 4.Return the value of result.
      return result;
   }

   function NamespaceLocalNameSet() {
      return Object.defineProperties(this, {
         "_ns" : { value: [] },
         "_ln" : { value: [] }
      });
   }
   NamespaceLocalNameSet.prototype.has = function (namespaceURI, localname) {
      var index = this._ns.indexOf(namespaceURI);
      if (index < 0)
         return false;
      if (this._ln[index] != localname)
         return false;
      return true;
   }
   NamespaceLocalNameSet.prototype.set = function (namespaceURI, localname) {
      if (!this.has(namespaceURI, localname)) {
         this._ns.push(namespaceURI);
         this._ln.push(localname);
      }
   }

   function serializeDocument(node, contextNamespace, namespacePrefixMap, generatedNamespacePrefixRef, requireWellFormed) {
      // If the require well-formed flag is set (its value is true), and this node has no documentElement
      // (the documentElement attribute's value is null), then throw an exception; the serialization of
      // this node would not be a well-formed document.
      if (requireWellFormed && (node.documentElement == null))
         throw new Error("Document without documentElement node is serialization error");
      // Otherwise, run the following steps:
      // 1.Let serialized document be an empty string.
      var serializedDocument = "";
      // 2.Append to serialized document the string produced by running the steps to produce a DocumentType
      //   serialization of node's doctype attribute provided the require well-formed flag if node's doctype
      //   attribute is not null.
      if (node.doctype != null)
         serializedDocument += serializeDocumentType(node.doctype, requireWellFormed);
      // 3.For each child child of node, in tree order, run the XML serialization algorithm on the child given
      //   a context namespace namespace, a namespace prefix map prefix map, a reference to a generated namespace
      //   prefix index prefix index, flag require well-formed, and append the result to serialized document.
      [].slice.call(node.childNodes).forEach(function serializeChildNodesOfDocument(childNode) {
         serializedDocument += xmlSerializationAlgorithm(childNode, contextNamespace, namespacePrefixMap, generatedNamespacePrefixRef, requireWellFormed);
      });
      // 4.Return the value of serialized document.
      return serializedDocument;
   }

   // To produce a DocumentType serialization of a Node node, given a require well-formed flag, the user agent
   // must return the result of the following algorithm:
   function serializeDocumentType(doctype, requireWellFormed) {
      // 1.If the require well-formed flag is true and the node's publicId attribute contains characters that are
      //   not matched by the XML PubidChar production [XML10], then throw an exception; the serialization of this
      //   node would not be a well-formed document type declaration.
      if (requireWellFormed && !matchXMLPubidProduction(doctype.publicId))
         throw new Error("Doctype serialization found invalid publicId characters");
      // 2.If the require well-formed flag is true and the node's systemId attribute contains characters that are
      //   not matched by the XML Char production [XML10] or that contains both a """ (U+0022 QUOTATION MARK) and
      //   a "'" (U+0027 APOSTROPHE), then throw an exception; the serialization of this node would not be a
      //   well-formed document type declaration.
      if (requireWellFormed && !matchXMLCharProduction(doctype.systemId) ||
          ((doctype.systemId.indexOf("\"") >= 0) && (doctype.systemId.indexOf("'") >= 0)))
          throw new Error("Doctype serialization found invalid systemId characters");
      // 3.Let markup be an empty string.
      var markup = "";
      // 4.Append the string "<!DOCTYPE" to markup.
      markup += "<!DOCTYPE";
      // 5.Append " " (U+0020 SPACE) to markup.
      markup += " ";
      // 6.Append the value of the node's name attribute to markup. For a node belonging to an HTML document,
      //   the value will be all lowercase.
      markup += doctype.name;
      // 7.If the node's publicId is not the empty string then append the following, in the order listed, to markup:
      if (doctype.publicId != "") {
         // 1." " (U+0020 SPACE);
         markup += " ";
         // 2.The string "PUBLIC";
         markup += "PUBLIC";
         // 3." " (U+0020 SPACE);
         markup += " ";
         // 4.""" (U+0022 QUOTATION MARK);
         markup += "\"";
         // 5.The value of the node's publicId attribute;
         markup += doctype.publicId;
         // 6.""" (U+0022 QUOTATION MARK).
         markup += "\"";
      }
      // 8.If the node's systemId is not the empty string and the node's publicId is set to the empty string,
      //   then append the following, in the order listed, to markup:
      if ((doctype.systemId != "") && (doctype.publicId == "")) {
         // 1." " (U+0020 SPACE);
         markup += " ";
         // 2.The string "SYSTEM".
         markup += "SYSTEM";
      }
      // 9.If the node's systemId is not the empty string then append the following, in the order listed, to
      //   markup:
      if (doctype.systemId != "") {
         // 1." " (U+0020 SPACE);
         markup += " ";
         // 2.""" (U+0022 QUOTATION MARK);
         markup += "\"";
         // 3.The value of the node's systemId attribute;
         markup += doctype.systemId;
         // 4.""" (U+0022 QUOTATION MARK).
         markup += "\"";
      }
      // 10.Append ">" (U+003E GREATER-THAN SIGN) to markup.
      markup += ">";
      // 11.Return the value of markup.
      return markup;
   }

   function serializeComment(node, requireWellFormed) {
      // If the require well-formed flag is set (its value is true), and node's data contains characters
      // that are not matched by the XML Char production [XML10] or contains "--" (two adjacent U+002D
      // HYPHEN-MINUS characters) or that ends with a "-" (U+002D HYPHEN-MINUS) character, then throw an
      // exception; the serialization of this node's data would not be well-formed.
      if (requireWellFormed && (!matchXMLCharProduction(node.data) ||
          (node.data.indexOf("--") >= 0) ||
          (node.data[node.data.length - 1] == "-")
         ))
         throw new Error("Comment has invalid characters");
      // Return the concatenation of "<!--", node's data, and "-->".
      return "<!--" + node.data + "-->";
   }

   function serializeText(node, requireWellFormed) {
      // 1.If the require well-formed flag is set (its value is true), and node's data contains characters
      //   that are not matched by the XML Char production [XML10], then throw an exception; the serialization
      //   of this node's data would not be well-formed.
      if (requireWellFormed && !matchXMLCharProduction(node.data))
         throw new Error("Text contained invalid characters");
      // 2.Let markup be the value of node's data.
      var markup = node.data;
      // 3.Replace any occurrences of "&" in markup by "&amp;".
      markup = markup.replace("&", "&amp;");
      // 4.Replace any occurrences of "<" in markup by "&lt;".
      markup = markup.replace("<", "&lt;");
      // 5.Replace any occurrences of ">" in markup by "&gt;".
      markup = markup.replace(">", "&gt;");
      // 6.Return the value of markup.
      return markup;
   }

   function serializeDocumentFragment(node, contextNamespace, namespacePrefixMap, generatedNamespacePrefixRef, requireWellFormed) {
      // 1.Let markup the empty string.
      var markup = "";
      // 2.For each child child of node, in tree order, run the XML serialization algorithm on the child
      //   given a context namespace namespace, a namespace prefix map prefix map, a reference to a generated
      //   namespace prefix index prefix index, and flag require well-formed. Concatenate the result to markup.
      [].slice.call(node.childNodes).forEach(function serializeChildNodesOfDocumentFragment(childNode) {
         markup += xmlSerializationAlgorithm(childNode, contextNamespace, namespacePrefixMap, generatedNamespacePrefixRef, requireWellFormed);
      });
      // 3.Return the value of markup.
      return markup;
   }

   function serializeProcessingInstruction(node, requireWellFormed) {
      // 1.If the require well-formed flag is set (its value is true), and node's target contains a ":"
      //   (U+003A COLON) character or is an ASCII case-insensitive match for the string "xml", then throw
      //   an exception; the serialization of this node's target would not be well-formed.
      if (requireWellFormed && ((node.target.indexOf(":") >= 0) || (node.target.toLowerCase() == "xml")))
         throw new Error("ProcessingInstruction's target contained invalid characters!");
      // 2.If the require well-formed flag is set (its value is true), and node's data contains characters
      //   that are not matched by the XML Char production [XML10] or contains the string "?>"
      //   (U+003F QUESTION MARK, U+003E GREATER-THAN SIGN), then throw an exception; the serialization
      //   of this node's data would not be well-formed.
      if (requireWellFormed && (!matchXMLCharProduction(node.data) || (node.data.indexOf("?>") >= 0)))
         throw new Error("ProcessingInstruction's data contained invalid characters");
      // 3.Let markup be the concatenation of the following, in the order listed:
      //   1."<?" (U+003C LESS-THAN SIGN, U+003F QUESTION MARK);
      var markup = "<?";
      //   2.The value of node's target;
      markup += node.target;
      //   3." " (U+0020 SPACE);
      markup += " ";
      //   4.The value of node's data;
      markup += node.data;
      //   5."?>" (U+003F QUESTION MARK, U+003E GREATER-THAN SIGN).
      markup += "?>";
      // 4.Return the value of markup.
      return markup;
   }

   function matchXMLNameProduction(name) {
      // TODO.
      return true;
   }

   function matchXMLCharProduction(name) {
      // TODO.
      return true;
   }

   function matchXMLPubidProduction(name) {
      // TODO.
      return true;
   }

   if (global.XMLSerializer) {
      global.XMLSerializer.prototype.serializeToStringPF = function( root ) {
         return xmlSerialization(root, false);
      }
   }
   if (global.Element) {
      Object.defineProperty(global.Element.prototype, "innerHTMLPF", {
         enumerable: true, configurable: true,
         get: function () {
            return fragmentSerializationAlgorithm(this, true);
         },
         set: function (value) {
            this.innerHTML = value;
         }
      });
   }

})(window);