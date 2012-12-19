<!doctype html>
<title>web-apps/media/ runner</title>
<style>
	iframe { display:none }
	ul { list-style:none; white-space:nowrap }
	body > ul { padding-left:0 }
	samp + span { position:absolute }
	.fail { color:red; background:papayawhip }
</style>
<iframe></iframe>
<!--<form>
		<p>Query string options: <label><input type=checkbox name=loop onchange="toggleLoop(this.checked)"> loop</label></p>
		</form>-->
<script>
function toggleLoop(checked) {
    for (var i = 0; i < document.links.length; ++i) {
	if (checked)
	    document.links[i].href += '?loop';
	else
	    document.links[i].href = document.links[i].href.replace(/\?loop$/, '');
    }
}

var iframe = document.querySelector('iframe');
var tests;
var current;
document.onclick = function(e) {
    if (e.target.nodeName == 'BUTTON') {
	if (e.target.textContent == 'Skip') {
	    opener.rr(undefined, 'Skipped');
	} else {
	    if (tests && tests[current] && tests[current].nextSibling.nextSibling.textContent == 'Running...') {
		tests[current].nextSibling.nextSibling.textContent = 'N/A: Aborted';
		removeSkipButton(tests[current]);
	    }
	    current = 0;
	    tests = e.target.nextSibling.getElementsByTagName('a');
	    loadTest();
	}
    }
}

opener = {};
opener.rr = function(passed, log) {
    tests[current].nextSibling.nextSibling.textContent = passed === undefined ? 'N/A: ' + log : (passed ? 'PASS' : (log ? 'FAIL: ' + log : 'FAIL'));
    if (passed !== undefined && !passed)
	tests[current].nextSibling.nextSibling.className = 'fail';
    removeSkipButton(tests[current]);
    current++;
    loadTest();
}

function completion_callback(tests) {
    var passed = tests.every(function(test) {return test.status === test.PASS});
    var log = "";
    if (!passed) {
	log = tests.filter(function(test){return test.status !== test.PASS}).map(function(test){return '"' + test.name + '" failed!' + ' : ' + test.message;}).join(" | ");
    }
    opener.rr(passed, log);
}

function loadTest() {
    if (tests[current]) {
	iframe.src = tests[current];
	tests[current].nextSibling.nextSibling.textContent = 'Running...';
	tests[current].nextSibling.nextSibling.className = '';
	tests[current].parentNode.appendChild(document.createTextNode(' '));
	tests[current].parentNode.appendChild(document.createElement('span'));
	tests[current].parentNode.lastChild.appendChild(document.createElement('button'));
	tests[current].parentNode.lastChild.firstChild.textContent = 'Skip';
    } else {
	iframe.src = 'about:blank';
    }
}

function removeSkipButton(link) {
    if (link.parentNode.childNodes.length == 5) {
	link.parentNode.removeChild(link.parentNode.lastChild);
	link.parentNode.removeChild(link.parentNode.lastChild);
    }
}
</script>
<ul><li><button>media</button><?php

function getDirectory( $path = '.' ){

  echo '<ul>';

  $ignore = array( 'resources', 'invalid', 'bugs', 'reftest', 'apple', 'microsoft', 'overview.html' );

  $files = @scandir( $path );

  if ( $files ){
    natcasesort( $files );

    foreach ( $files as $file ){

      if( $file[0] !== '.' && !in_array( $file, $ignore ) && ( isset( $_GET['mp4'] ) || !strpos( $file, 'mp4' ) ) ){

	if( is_dir( "$path/$file" ) ){

	  echo "<li><button>" . htmlspecialchars($file) . "</button>";
	  getDirectory( "$path/$file" );

	} else {

	  if( preg_match( '/\.html?$/', $file ) && !preg_match( "/^\d\d\d-/", $file ) )
	    echo "<li><a href=\"" . htmlspecialchars("$path/$file") . "\">" . htmlspecialchars($file) . "</a> <samp></samp>";

	}

      }

    }
  }

  echo '</ul>';

}

getDirectory(".");

?></ul>
