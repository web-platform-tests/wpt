<?php
# I hate PHP, but it's what I know, so this is fastest . . .
echo '<!doctype html>';

if (empty($_POST)) {
	die('<title>Error</title><p>Not POSTed');
}

if (sha1($_POST['password']) !== 'd962ad564032fa99ca43e8f0f6875c8efb9e2905') {
	# I love how hash functions let me leave the source code open with no
	# database or secret files, without disclosing the password.
	die('<title>Error</title><p>Incorrect password');
}

if ($_POST['ua'] !== 'webkit' && $_POST['ua'] !== 'gecko') {
	die('<title>Error</title><p>No UA provided: must be either "webkit" or "gecko"');
}

if (file_put_contents($_POST['ua'] . '-data', $_POST['output']) === false) {
	die('<title>Error</title><p>Write failed!');
}

echo '<title>Success</title><p>Successfully wrote ' . $_POST['ua'] . '-data.';
echo '<p>Time taken for test generation: ' . intval($_POST['elapsed']/60000)
	. ':' . sprintf('%06.3F', ($_POST['elapsed'] % 60000)/1000) . ' min.';
echo '<ul>' . $_POST['errors'] . '</ul>';
