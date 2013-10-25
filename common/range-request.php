<?php

/**
 * Range Request - A tool to simulate range requests. (It can be also used for bandwidth throttling and slicing)
 *
 * Usage:
 * range-request.php?QUERY_STRING
 *
 * QUERY_STRING can contain any of the following tuples:
 *
 * fileloc=FILE : The {rel|abs}path to file to send (Default = preload.ogv)
 * rate=BYTES : Number of bytes to send every SLEEP sencods (Default = 1024, 0 means no throttling)
 * sleep=SLEEP : Number of seconds to sleep before sending the next number of BYTES (Default = 1)
 * if-range=HTTP_CODE : The HTTP response to send (works only if If $_SERVER['HTTP_IF_RANGE'] is set)
 * etag=yes : Send an 'ETag' response-header
 * cachecontrol=CACHE_CONTROL : Send a 'Cache-Control: CACHE_CONTROL' response-header
 * expires=yes : Send an 'Expire' response-header
 * lastmodified=yes : Send a 'Last-Modified' response-header
 * date=yes : Send a 'Date' response-header with the Date set to 1 second ago to emulate some network lag
 * status=HTTP_STATUS : The HTTP response status to be send in the response header (Default = '206 Partial Content' if $_SERVER['HTTP_RANGE'] is set)
 * chunked=yes : Do not send a 'Content-Length' response-header and the response will be treated as 'chunked'(i.e. Transfer-Encoding: chunked)
 * contentrange=no : Do not send a 'Content-Range' response-header
 * acceptranges=none : Send an 'Accept-Ranges: none' response-header (Default = 'Accept-Ranges: bytes')
 * size=SIZE : Number of bytes to send. Also used as the second range in 'Content-Range' and/or in 'Content-Length: SIZE' response header (Default = filesize(FILE))
 * contenttype=CONTENT_TYPE : Send a 'Content-Type: CONTENT_TYPE' response-header (Default = will try to detect from file or 'application/octet-stream' if it fails to detect)
 * contentrangeoffset : The number of bytes to add to the second range in 'Content-Range' to create invalid range responses (Default = 0)
 * logfile=LOGFILE : Logs the output to LOGFILE
 *
 * Examples:
 * range-request.php?etag=yes&cachecontrol=must-revalidate&status=200%20OK&acceptranges=no&contentrange=no&chunked=yes
 * range-request.php?fileloc=myfile&logfile=mylogfile&rate=50&chunked=yes&status=200%20OK : Sends 'myfile' at 50B/s with no Content-Length and writes log to 'mylogfile'
 * range-request.php?fileloc=myfile&if-range=200&contenttype=video/ogg&size=20&rate=1 : Sends the first 20 bytes of 'myfile' with video/ogg Content-Type at 1B/s
 * range-request.php?fileloc=myfile&if-range=200&rate=0 : Sends 'myfile' at maximum speed (will try to detect the content-type)
 * range-request.php?fileloc=myfile&contentrangeoffset=1 : Sends 'myfile' with invalid Content-Range resoponse (1 byte more than requested)
 *
 * @author Jose Anto Akkara <joseaa@opera.com>
 * @author Payman Delshad <payman@opera.com>
 * @version 1.0
 *
 */

function httpdate($timestamp)
{
  return gmdate("D, d M Y H:i:s", $timestamp);
}

function getcontenttype($file) {
  $type = null;
  if (function_exists('finfo_file')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $type = finfo_file($finfo, $file);
    finfo_close($finfo);
  }
  if ((!$type || $type == 'application/octet-stream') && function_exists('exec')) {
    $second_opinion = exec('file -b --mime-type ' . escapeshellarg($file), $foo, $return_code);
    if ($return_code == '0' && $second_opinion) {
      $type = $second_opinion;
    }
  }

  return $type;
}

function loadfile($filelocation, $rate)
{
  $log = isset($_GET['logfile']); //should we log or not?
  if ($log) {
    $logfile = '../logfiles/' . basename($_GET['logfile']); //only allow writing to ../logfiles/
    $lp = fopen($logfile, 'a'); //pointer to write to log file
    if (!$lp)
      die('Cannot open the log file: ' . $logfile); //bail if you can't open the log file
  }

  $fp = fopen("$filelocation","rb"); //pointer to read from file
  if (!$fp) {
    $msg = "Cannot open file: $filelocation\n";
    if ($log) {
      fwrite($lp, $msg);
      fclose($lp);
    }
    die($msg); //bail if you can't read the file
  }

  if (isset($_GET['size']) && intval($_GET['size']) <= filesize($filelocation) && intval($_GET['size']) != 0) { //use the provided 'size' for slicing
    $filesize = intval($_GET['size']);
  }
  else {
    $filesize = filesize($filelocation);
  }
  if ($filesize == 0) {
    $msg = "'Zero byte file! Aborting download.\n";
    if ($log) {
      fwrite($lp, $msg);
      fclose($lp);
    }
    fclose($fp);
    die($msg); //bail if filesize = 0
  }

  if ($rate == 0)
    $rate = $filesize; //rate=0 means no throtteling

  if (isset($_GET['contenttype']))
    $content_type = $_GET['contenttype']; //use the provided 'contenttype'
  else {
    $content_type = getcontenttype($filelocation); //try to detect the content-type
    if (!$content_type) $content_type = 'application/octet-stream'; //default content-type
  }

  $range1 = 0;
  $range2 = $filesize-1;

  $use_range = isset($_SERVER['HTTP_RANGE']);
  $content_range_offset = isset($_GET['contentrangeoffset']) ? intval($_GET['contentrangeoffset']) : 0;

  if (isset($_GET['if-range']) && isset($_SERVER['HTTP_IF_RANGE']))
    {
      switch ($_GET['if-range'])
	{
	case '200':
	  // pretend that the If-Range check failed and return 200 OK
	  $use_range = false;
	  break;
	case '400':
	  header('HTTP/1.1 400 Bad Request');
	  $msg = 'Sorry, requested range (bytes='.$range1.'-'.$range2.') is not satisfiable!';
	  if ($log) {
	    fwrite($lp, $msg);
	    fwrite($lp, "\n");
	    fclose($lp);
	  }
	  fclose($fp);
	  die($msg);
	  break;
	}
    }

  if ($use_range)
    {
      preg_match('/bytes=(\d+)-(\d+)?/', $_SERVER['HTTP_RANGE'], $matches);
      $range1 = intval($matches[1]);
      $range2 = intval($matches[2]);

      if($range2 == 0)
        $range2 = $filesize-1;

      $length = $range2 - $range1 + 1;

      if (isset($_GET['etag']))
	{
	  $content = floor(mktime()/30)*30;
	  $etag = md5($content);
	  header('ETag: '.$etag);
	}

      if (isset($_GET['cachecontrol']))
        header('Cache-Control: '.$_GET['cachecontrol']);

      if (isset($_GET['expires']))
	{
	  header('Expires: '.gmdate('D, j M Y H:i:s T', time() + 200));
	  header('Cache-Control: max-age=200, must-revalidate');
	}

      if(isset($_GET['lastmodified']))
	{
	  $last_modified_time = filemtime($filelocation);
	  header("Last-Modified: ".httpdate($last_modified_time)." GMT");
	}

      if(isset($_GET['date']))
	{
	  // set the Date to 1 second ago emulate some network lag
	  header("Date: ".httpdate(time()-1)." GMT");
	}

      if (isset($_GET['status']))
        header('HTTP/1.1 ' . $_GET['status']);
      else
        header('HTTP/1.1 206 Partial Content');

      header('Content-Type: ' . $content_type);

      if(!isset($_GET['chunked']))
        header('Content-Length: ' . $length);

      if (!isset($_GET['contentrange']))
        header('Content-Range: bytes ' . $range1 . '-' . ($range2 + $content_range_offset) . '/' . $filesize);

      if (!isset($_GET['acceptranges']))
        header('Accept-Ranges: bytes');
      else
        header('Accept-Ranges: none');

      if ($log) {
	fwrite($lp,"\n");
	fwrite($lp, $_SERVER['HTTP_RANGE']);
	fwrite($lp, "\t\t\t");
      }

    }
  else
    {
      header('HTTP/1.1 200 OK');
      header('Content-Type: ' . $content_type);

      if (!isset($_GET['chunked']))
        header('Content-Length: ' . $filesize);

      if (isset($_GET['etag']))
	{
	  $content = floor(mktime()/30)*30;
	  $etag = md5($content);
	  header('ETag: '.$etag);
	}
    }

  if ($range1 > $range2 || $range2 >= $filesize) {
    header('HTTP/1.1 416 Requested Range Not Satisfiable');
    $msg = 'Sorry, requested range (bytes='.$range1.'-'.$range2.') is not satisfiable!';
    if ($log) {
      fwrite($lp, $msg);
      fwrite($lp, "\n");
      fclose($lp);
    }
    fclose($fp);
    die($msg);
  }

  fseek($fp,$range1);
  $tempfp = $range1;
  $count = 0;

  while (!feof($fp) and (connection_status()==0)) {
    set_time_limit(0);
    ignore_user_abort(true);
    if($tempfp > $range2)
      break;
    print(fread($fp,$rate));
    $tempfp = $rate + $tempfp;
    $count++;
    flush();
    ob_flush();
    sleep($GLOBALS['sleep']);
  }

  if ($log) {
    fwrite($lp, $count*$rate);
    fwrite($lp, "\n");
    fclose($lp);
  }
  fclose($fp);
}

if (isset($_GET['fileloc']))
  $filelocation = $_GET['fileloc'];
else
  $filelocation = 'preload.ogv';
if (isset($_GET['rate']))
  $rate = intval($_GET['rate']);
else
  $rate = 1024;
if (isset($_GET['sleep']))
  $sleep = intval($_GET['sleep']);
else
  $sleep = 1;

loadfile($filelocation, $rate);

?>