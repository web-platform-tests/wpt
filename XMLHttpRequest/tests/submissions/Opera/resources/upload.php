<?php
ksort($_POST);
ksort($_FILES);
if (!empty($_POST))
  foreach ($_POST as $k => $v)
		echo "{$k}={$v},";
echo "\n";
if (!empty($_FILES))
	foreach ($_FILES as $k => $v)
		echo "{$k}={$v['name']}:{$v['type']}:{$v['size']},";

?>
