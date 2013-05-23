<?php

//Prevent Caching
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

//====================================================
//                 START OF TESTS 
//====================================================

//Get Test ID
$TestID = intval($_GET["TestID"]);

if($TestID === 1)  //1. Basic Cross-Origin Test - Allowed (*)
{
    addHeader("Access-Control-Allow-Origin", "*");
    print("test");
}
else if ($TestID === 2) //2. Basic Cross-Origin Test - Allowed (matching origin)
{
    $origin = "" . $_SERVER["HTTP_ORIGIN"];
    addHeader("Access-Control-Allow-Origin", $origin);
    print("test");
}
else if ($TestID === 3) //3. Basic Cross-Origin Test - Disallowed (non-matching origin)
{
    addHeader("Access-Control-Allow-Origin", "http://example.com/");
    print("test");
}
else if ($TestID === 4) //4. Basic Cross-Origin Test - Disallowed (Access-Control-Allow-Origin header not given)
{
    print("test");
}
else if ($TestID === 5) //5. Preflight wiith correct "Access-Control-Request-Method" sent for a Non-simple Method
{
    addHeader("Access-Control-Allow-Origin", "*");
    if(isPreflight())
    {
        addHeader("Access-Control-Allow-Methods", "OPTIONS");
        $requestMethod = "" . $_SERVER["HTTP_ACCESS_CONTROL_REQUEST_METHOD"];
        $result = "fail";
        if(strtolower($requestMethod) === "options")
        {
            $result = "pass";
        }
        writePersistantData($result);
    }
    else
    {
        $data = retrievePersistantData();
        if($data !== null)
        {
            print($data);
        }
        else
        {
            print("fail");
        }
    }
}
else if ($TestID === 6) //6. Preflight Sent for a non-simple header - With correct "Access-Control-Request-Headers"
{
    addHeader("Access-Control-Allow-Origin", "*");
    if(isPreflight())
    {
        addHeader("Access-Control-Allow-Headers", "x-test");
        addHeader("Access-Control-Allow-Methods", "OPTIONS");
        
        $requeestHeaders = "" . $_SERVER["HTTP_ACCESS_CONTROL_REQUEST_HEADERS"];
        $result = "fail";
        if(stripos($requeestHeaders, "x-test") !== false)
        {
            $result = "pass";
        }
        writePersistantData($result);
    }
    else
    {
        $data = retrievePersistantData();
        if($data !== null)
        {
            print($data);
        }
        else
        {
            print("fail");
        }
    }
}
else if ($TestID === 7) //7. Author Request Headers do not appear in preflight
{
    addHeader("Access-Control-Allow-Origin", "*");
    if(isPreflight())
    {
        addHeader("Access-Control-Allow-Headers", "x-test");
        addHeader("Access-Control-Allow-Methods", "OPTIONS");
        
        $result = "fail";
        if($_SERVER["HTTP_X_TEST"] === null)
        {
            $result = "pass";
        }
        writePersistantData($result);
    }
    else
    {
        $data = retrievePersistantData();
        if($data !== null)
        {
            print($data);
        }
        else
        {
            print("fail");
        }
    }
}
else if ($TestID === 8) //8. "Cookie" Header not sent if withCredentials is false
{
    $origin = "" . $_SERVER["HTTP_ORIGIN"];
    addHeader("Access-Control-Allow-Origin", $origin);
    addHeader("Access-Control-Allow-Credentials", "true");
    
    if($_SERVER["HTTP_COOKIE"] === null)
    {
        print("pass");
    }
    else
    {
        print("fail");
    }
}
else if ($TestID === 9) //9. Request fails if "Access-Control-Allow-Origin: *" and withCredentials is true 
{
    addHeader("Access-Control-Allow-Origin", "*");
    addHeader("Access-Control-Allow-Credentials", "true");
    print("test");
}
else if ($TestID === 10 || $TestID === 11) //10-11. Verify simple response headers are always exposed to getResponseHeader() and getAllResponseHeaders()
{
    addHeader("Access-Control-Allow-Origin", "*");
    print("test");
}
else if ($TestID === 12) //12. Verify non-simple Headers are only exposed if in Access-Control-Expose-Header
{
    addHeader("Access-Control-Allow-Origin", "*");
    addHeader("X-FOO", "BAR");
    addHeader("X-TEST", "TEST");
    addHeader("Access-Control-Expose-Headers", "X-FOO");
    print("test");
}
else if ($TestID === 13) //13. Verify withCredential Request fails if Access-Control-Allow-Credentials =  false
{
    $origin = "" . $_SERVER["HTTP_ORIGIN"];
    addHeader("Access-Control-Allow-Origin", $origin);
    addHeader("Access-Control-Allow-Credentials", "false");
    print("test");
}
else if ($TestID === 14) //14. Basic Cross-origin redirect scenario (A->B->B) Redirects to TestID=140
{
    $origin = "" . $_SERVER["HTTP_ORIGIN"];
    addHeader("Access-Control-Allow-Origin", $origin);
    header("HTTP/1.1 302 Found");
    $newURL =  "http://" . $_SERVER['HTTP_HOST']  . $_SERVER['PHP_SELF'] . "?" . $_SERVER['QUERY_STRING'] . "0";
    addHeader("Location", $newURL);
}
else if ($TestID === 140) // Redirect destination for test #14
{
    $origin = "" . $_SERVER["HTTP_ORIGIN"];
    addHeader("Access-Control-Allow-Origin", $origin);
    print("test");
}
else
{
    header("HTTP/1.1 404 Not Found");
}

//====================================================
//                 END OF TESTS 
//====================================================


// Sets the HTTP header with the given name and value
function addHeader($headerName, $headerValue)
{
    header($headerName . ": " . $headerValue);
}

// Returns true if it is a preflight request. False if it is not.
function isPreflight()
{
    //Checks for an OPTIONS request with Access-Control-Request-Method Header
    return ($_SERVER['REQUEST_METHOD'] === "OPTIONS" && $_SERVER["HTTP_ACCESS_CONTROL_REQUEST_METHOD"] !== null);
}

// Writes persistant data used to map preflight to the request
function writePersistantData($data)
{
    $RequestID = intval($_GET["RequestID"]);
	$tempfile = sys_get_tempdir() . "/" . "preflightData/" . $RequestID;
	
    if($RequestID !== 0)
    {
        $data .= "|" . time();
        file_put_contents($tempfile, $data);
    }
}

/// Retrieves the persistant data and deletes it from the server. Returns null on error
function retrievePersistantData()
{
    $RequestID = intval($_GET["RequestID"]);
	$tempfile = sys_get_tempdir() . "/" . "preflightData/" . $RequestID;
    if($RequestID !== 0 && file_exists($tempfile))
    {
        $data = file_get_contents($tempfile);
        if($data == null)
        {
            return null;
        }
        
        //Delete saved data from persistant storage
        unlink($tempfile);
        
        //If in incorrect format, return null
        $dataArray = explode('|', $data);
        if(count($dataArray) != 2)
        {
            return null;
        }
        
        // If data was saved more than 5 seconds ago, it is probably not matching the correct 
        //  preflight return null
        $saveTime = intval($dataArray[1]);
        if($saveTime === 0 || time() - $saveTime > 5)
        {
            return null;
        }
        
        return $dataArray[0];
    }
    else
    {
        return null;
    }
}
?>