<?php
# I hate PHP, but it's what I know, so this is fastest . . .
if (empty($_POST)) {
	die('<!doctype html><title>Error</title><p>Not POSTed');
}

if (sha1($_POST['password']) !== 'd962ad564032fa99ca43e8f0f6875c8efb9e2905') {
	# I love how hash functions let me leave the source code open with no
	# database or secret files, without disclosing the password.
	die('<!doctype html><title>Error</title><p>Incorrect password');
}

if ($_POST['ua'] !== 'webkit' && $_POST['ua'] !== 'gecko') {
	die('<!doctype html><title>Error</title><p>No UA provided: must be either "webkit" or "gecko"');
}

if (file_put_contents($_POST['ua'] . '-data', $_POST['data']) === false) {
	die('<!doctype html><title>Error</title><p>Write failed!');
}

echo '<!doctype html><title>Success</title><p>Successfully wrote ' . $_POST['ua'] . '-data';
