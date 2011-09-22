<?php
# I hate PHP, but it's what I know, so this is fastest . . .
if (sha1($_POST['password']) !== 'd962ad564032fa99ca43e8f0f6875c8efb9e2905') {
	# I love how hash functions let me leave the source code open with no
	# database or secret files, without disclosing the password.
	die('Incorrect password');
}

if ($_POST['ua'] !== 'webkit' && $_POST['ua'] !== 'gecko') {
	die('No UA provided: must be either "webkit" or "gecko"');
}

if (file_put_contents($_POST['ua'] . '-data', $_POST['data']) === false) {
	die('Write failed!');
}

echo 'Successfully wrote ' . $_POST['ua'] . '-data';
