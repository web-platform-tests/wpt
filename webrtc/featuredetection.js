// 2012-01-27
//  The code below has been stolen from Microsoft's submission tests to the Page Visibility
//  specification. Thanks!


// This function returns the value of an API feature if it is defined with one of
// the known ventor prefixes. 
//
// Parameters:
//  parent: the object containing the API feature
//  feature: the name of the API feature, this should be a string value
//  isAttribute: set this to true to indicate that this is a constant attribute
//               as opposed to a variable
function BrowserHasFeature(parent, feature, isAttribute)
{
    if (parent[feature] !== undefined)
    {
        //feature is defined without a vendor prefix, no further checks necessary
        return parent[feature];
    }

    // the feature is not defined without a vendor prefix, so find the vendor prefix, if any,
    // that it is defined with
    var prefix = GetVendorPrefix(parent, feature, isAttribute);
    
    // if prefix is not undefined, then the feature has been found to exist with this prefix
    if (prefix !== undefined)
    {
        var prefixedFeatureName = AppendPrefix(prefix, feature, isAttribute);
        return parent[prefixedFeatureName];
    }

    //The feature does not exist.
    //Callers should check for !==undefined as the feature itself could return
    //a Bool which would fail a typical if(feature) check
    return undefined;
}

// returns the name of the feature in the said browser
function FeatureNameInBrowser(parent, feature, isAttribute)
{
    if (parent[feature] !== undefined)
    {
        //feature is defined without a vendor prefix, no further checks necessary
        return feature;
    }

    // the feature is not defined without a vendor prefix, so find the vendor prefix, if any,
    // that it is defined with
    var prefix = GetVendorPrefix(parent, feature, isAttribute);
    
    // if prefix is not undefined, then the feature has been found to exist with this prefix
    if (prefix !== undefined)
    {
        var prefixedFeatureName = AppendPrefix(prefix, feature, isAttribute);
        return prefixedFeatureName;
    }

    //The feature does not exist.
    //Callers should check for !==undefined as the feature itself could return
    //a Bool which would fail a typical if(feature) check
    return undefined;
}


// This function returns the vendor prefix found if a certain feature is defined with it.
// It takes the same parameters at BrowserHasFeature().
function GetVendorPrefix(parent, feature, isAttribute)
{
    //Known vendor prefixes
    var VendorPrefixes = ["moz", "ms", "o", "webkit"];
    for (vendor in VendorPrefixes)
    {
        //Build up the new feature name with the vendor prefix
        var prefixedFeatureName = AppendPrefix(VendorPrefixes[vendor], feature, isAttribute);
        if (parent[prefixedFeatureName] !== undefined)
        {
            //Vendor prefix version exists, return a pointer to the feature
            return VendorPrefixes[vendor];
        }
    }
    
    // if no version of the feature with a vendor prefix has been found, return undefined
    return undefined;
}

// This will properly capitalize the feature name and then return the feature name preceded
// with the provided vendor prefix. If the prefix given is undefined, this function will
// return the feature name given as is. The output of this function should not be used
// as an indicator of whether or not a feature exists as it will return the same thing if
// the inputted feature is undefined or is defined without a vendor prefix. It takes the 
// same parameters at BrowserHasFeature().
function AppendPrefix(prefix, feature, isAttribute)
{
    if (prefix !== undefined)
    {
        if (isAttribute)
        {
            // if a certain feature is an attribute, then it follows a different naming standard
            // where it must be completely capitalized and have words split with an underscore
            return prefix.toUpperCase() + "_" + feature.toUpperCase();
        }
        else
        {
            //Vendor prefixing should follow the standard convention: vendorprefixFeature
            //Note that the feature is capitalized after the vendor prefix
            //Therefore if the feature is window.feature, the vendor prefix version is:
            //window.[vp]Feature where vp is the vendor prefix: 
            //window.msFeature, window.webkitFeature, window.mozFeature, window.oFeature
            var newFeature = feature[0].toUpperCase() + feature.substr(1, feature.length);

            //Build up the new feature name with the vendor prefix
            return prefix + newFeature;
        }
    }
    else
    {
        return feature;
    }
}