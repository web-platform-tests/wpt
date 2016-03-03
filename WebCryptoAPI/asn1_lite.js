//
//  Provide a small set of light weight asn1 routines
//

function asn1_get_length(asn1Data, offset)
{
    var i = asn1Data[offset];
    var v = 0;
    var j;

    if (i & 0x80) {
        i = i & 0x7f;
        for (j = 0; j < i; j++) {
            v = v * 256 + asn1Data[offset+j+1];
        }
        return [i+1, v];
    }
    else return [1, i];
}

function asn1_recurse_fields(asn1Data, start, dataLength)
{
    var fieldList = [];
    var fieldLength;
    var i;
    var c;
    var end = start + dataLength;

    for (i=start; i<end; i++) {
        // Assume all tags are one byte long
        fieldLength = asn1_get_length(asn1Data, i+1);
        switch (asn1Data[i]) {
        case 0x30:
        case 0x31:
            c = fieldLength[0] + 1;
            fieldList.push(asn1Data.subarray(i, i + c));
            fieldList = fieldList.concat(asn1_recurse_fields(asn1Data, i+ c, fieldLength[1]));
            break;

        default:
            fieldList.push(asn1Data.subarray(i, i + 1 + fieldLength[0] + fieldLength[1]));
            break;
        }
        i += fieldLength[0] + fieldLength[1];
    }
    return fieldList;
}

function asn1_to_fields(asn1Data)
{
    var x = new Uint8Array(asn1Data)
    return asn1_recurse_fields(x, 0, x.length);
}

function asn1_to_uint8(dataArray)
{
    var c = 0;
    var item;

    dataArray.forEach(function(item) { c += item.length; });

    var asn = new Uint8Array(c);
    var i = 0;

    dataArray.forEach(function(item) {
        asn.set(item, i);
        i += item.length;
    });

    return asn;
}

function asn1_encode_length(dataLength)
{
    if (dataLength < 0x80) {
        return new Uint8Array([dataLength]);
    }
    else if (dataLength < 256) {
        return new Uint8Array([0x81, dataLength]);
    }
    else if (dataLength < 65536) {
        return new Uint8Array([0x82, dataLength/256, dataLength % 256]);
    }
    return Uint8Array([0x83, dataLength/65536, (dataLength/256)%256, dataLength%256]);
}

function asn1_encode(tag, dataArray)
{
    var data = asn1_to_uint8(dataArray);
    var length = asn1_encode_length(data.length);

    var result = [new Uint8Array([tag]), length, data];

    return result;
}

function asn1_encode_bitstring(dataArray)
{
    var data = asn1_to_uint8(dataArray);
    var length = asn1_encode_length(data.length+1);

    var result = [new Uint8Array([0x03]), length, new Uint8Array([0]), data];

    return result;
}

function asn1_encode_integer(dataArray)
{
    var data = asn1_to_uint8(dataArray);
    if (data[0] > 0x7f) {
        data = asn1_to_uint8([new Uint8Array([0]), data]);
    }
    var length = asn1_encode_length(data.length);

    var result = [new Uint8Array([0x02]), length, data];

    return result;
}
