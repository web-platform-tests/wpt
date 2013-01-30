<?php
/*
 * Copyright © 2013 Rodney Rehm - http://redneyrehm.de/en/
 *
 * This work is distributed under the W3C® Software License [1] and MIT License [2]
 * in the hope that it will be useful, but WITHOUT ANY 
 * WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * 
 * [1] http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231 
 * [2] http://opensource.org/licenses/mit-license
*/

// test with: curl -i 'http://your-host-name-thingie/delay.php?type=json&delay=1000&status=404&message=Not+Found'

// using _REQUEST instead of _GET because this might also help for some <form> submission testing?
$_delay = !empty($_REQUEST['delay']) ? intval($_REQUEST['delay']) : 0;
$_type = !empty($_REQUEST['type']) ? $_REQUEST['type'] : null;
$_contentType = !empty($_REQUEST['content-type']) ? $_REQUEST['content-type'] : null;
$_status = !empty($_REQUEST['status']) ? intval($_REQUEST['status']) : null;
$_message = !empty($_REQUEST['message']) ? $_REQUEST['message'] : null;
$_charset = !empty($_REQUEST['charset']) ? $_REQUEST['charset'] : 'utf-8';
$_relocate = !empty($_REQUEST['relocate']) ? $_REQUEST['relocate'] : null;
// probably better to NOT accept arbitray data for output body

$data = array(
    'gif' => array(
        'type' => 'image/gif',
        'body' => base64_decode('R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='),
    ),
    'svg' => array(
        'type' => 'image/svg+xml',
        'charset' => true,
        // http://www.w3.org/TR/SVG/shapes.html#ExampleRect01
        'body' => '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
            <svg width="12cm" height="4cm" viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" version="1.1">
              <desc>Example rect01 - rectangle with sharp corners</desc>
              <rect x="1" y="1" width="1198" height="398" fill="none" stroke="blue" stroke-width="2"/>
              <rect x="400" y="100" width="400" height="200" fill="yellow" stroke="navy" stroke-width="10"  />
            </svg>',
    ),
    'html' => array(
        'type' => 'text/html',
        'charset' => true,
        'body' => '<!doctype html><html><head><title>Hello</title></head><body><p>world</p></body></html>',
    ),
    'css' => array(
        'type' => 'text/css',
        'charset' => true,
        'body' => '.some-random-selector-you-wont-know { background: green; }',
    ),
    'js' => array(
        'type' => 'application/javascript',
        'charset' => true,
        'body' => 'function someRandomFunctionYouWontKnow() { return "hello world"; }',
    ),
    'json' => array(
        'type' => 'application/json',
        'charset' => true,
        'body' => json_encode(array("some" => "data")),
    ),
    'help' => array(
        'type' => 'text/plain',
        'charset' => true,
        'body' => "call {$_SERVER['SCRIPT_URI']} with the following parameters provided as GET or POST:\n"
            ."    type=html - [{types}]\n"
            ."Optional parameters:"
            ."    delay=1000 - delay response for 1000ms\n"
            ."    type=1000 - delay response for 1000ms\n"
            ."    status=404 - http response code\n"
            ."    message=Not+Found - http response message\n"
            ."    content-type=text/html - overwrite default mime types\n"
            ."    relocate=http%3A%2F%2Fexample.com%2F - relocate to given URL (overwrites code=302, message=Moved+Temporarily)\n"
            ."    charset=UTF-8 - have non-binary output encoded to specific encoding (e.g. ISO-8859-1 or UTF-16BE\n"
            ."                    see http://php.net/manual/en/function.mb-list-encodings.php#example-2615 for more)\n",
    ),
);


if (!$_type || empty($data[$_type])) {
    $_type = 'help';
}

$response = $data[$_type];

if ($_type === 'help') {
    // inject possible types
    $response['body'] = str_replace('{types}', join(', ', array_keys($data)), $response['body']);
}

// callee might want to delay a different resource
if ($_relocate) {
    // http://httpstatus.es/302
    $_status = 302;
    $_message = "Moved Temporarily";
}

// callee might need to test a certain response code
if ($_status) {
    // "php-cgi" < 5.3, "php-cgi" >= 5.3, "php-fpm" >= 5.3.3
    $prefix = strpos(PHP_SAPI, 'cgi') !== false
        ? $_SERVER['SERVER_PROTOCOL']
        : 'Status:';

    header("{$prefix} {$_status} {$_message}", true, $_status);

    if ($_relocate) {
        header("Location: {$_relocate}", true);
    }
}

if ($_delay) {
    // range [0s, 10s]
    usleep(min(10000, abs($_delay)) * 1000);
}

if (!$_contentType) {
    $_contentType = $response['type'];
}

if (!empty($response['charset'])) {
    $body = convertCharset($response['body'], $_charset);
    header("Content-Type: {$_contentType}; charset={$_charset}", true);
    echo $body;
} else {
    header("Content-Type: {$_contentType}", true);
    echo $response['body'];
}


function convertCharset($string, &$toCharset, $fromCharset='UTF-8') {
    // Note: unsupported charsets are reverted to UTF-8
    $converted = null;
    
    if (strtolower($fromCharset) === strtolower($toCharset)) {
        return $string;
    }
    
    if (function_exists('mb_convert_encoding')) {
       $converted = @mb_convert_encoding($string, $toCharset, $fromCharset);
    }
    
    if (function_exists('iconv')) {
        $converted = @iconv($fromCharset, $toCharset, $string);
    }
    
    if (function_exists('recode_string')) {
        $converted = @recode_string($fromCharset .'..'. $toCharset, $string);
    }

    if (error_get_last()) {
        $toCharset = $fromCharset;
        return $string;
    }
        
    if ($converted !== null) {
        return $converted;
    }

    throw new Exception('none of [recode, iconv, mbstring] available. how are we supposed to work on strings here?');
}