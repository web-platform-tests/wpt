<?php
  $file_name = 'logs.txt';
  $ident = isset($_GET['ident']) ? $_GET['ident'] : NULL;
  $buffer = '';
  $obj;

  $file = fopen($file_name, 'c+');

  if (filesize($file_name))
  {
    $buffer = fread($file, filesize($file_name));

    if ($buffer)
      $obj = json_decode($buffer);
  }

  if (isset($ident))
    if (!$obj->$ident)
      $obj->$ident = true;

  $buffer = json_encode($obj);

  rewind($file);
  ftruncate($file, 0);
  fwrite($file, $buffer);
  fclose($file);
?>
