<?php
  $file_name = 'logs.txt';
  $ident = isset($_GET['ident']) ? $_GET['ident'] : NULL;
  $buffer = '';
  $obj;

  $file = fopen($file_name,'r+');

  if (filesize($file_name))
  {
    $buffer = fread($file, filesize($file_name));

    if ($buffer)
      $obj = json_decode($buffer);
  }

  if (isset($ident))
    if ($obj->$ident)
    {
      print "1";

      unset($obj->$ident);

      $buffer = json_encode($obj);

      rewind($file);
      ftruncate($file, 0);
      fwrite($file, $buffer);
    }
    else
      print "0";

  fclose($file);
?>
