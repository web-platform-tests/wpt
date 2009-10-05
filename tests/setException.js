try
{
    var setException = (DOMException === undefined);
}
catch(e)
{
    var setException = true;
}

if (setException)
{
    i = 1;
    DOMException = {
        "INDEX_SIZE_ERR": i++,
        "DOMSTRING_SIZE_ERR": i++,
        "HIERARCHY_REQUEST_ERR": i++,
        "WRONG_DOCUMENT_ERR": i++,
        "INVALID_CHARACTER_ERR": i++,
        "NO_DATA_ALLOWED_ERR": i++,
        "NO_MODIFICATION_ALLOWED_ERR": i++,
        "NOT_FOUND_ERR": i++,
        "NOT_SUPPORTED_ERR": i++,
        "INUSE_ATTRIBUTE_ERR": i++,
        "INVALID_STATE_ERR": i++,
        "SYNTAX_ERR": i++,
        "INVALID_MODIFICATION_ERR": i++,
        "NAMESPACE_ERR": i++,
        "INVALID_ACCESS_ERR": i++,
        "VALIDATION_ERR": i++,
        "TYPE_MISMATCH_ERR": i++,
        "SECURITY_ERR": i++,
        "NETWORK_ERR": i++,
        "ABORT_ERR": i++,
        "URL_MISMATCH_ERR": i++,
        "QUOTA_EXCEEDED_ERR": i++,
        "DATAGRID_MODEL_ERR": i++
    };
}
