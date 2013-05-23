<?php
header("Content-type: text/javascript");

function isset_or_je(&$check, $alternate = NULL) 
{ 
    return (isset($check)) ? (empty($check) ? $alternate : json_encode($check)) : $alternate; 
}

?>
(function ()
{
 var attachPoint = document.getElementById(<?php echo json_encode($_GET['attachTo']) ?>);

 var newElem = document.createElement(<?php echo json_encode($_GET['type']) ?>);


 var newSrc = "";

 newSrc += <?php echo isset_or_je($_GET['protocol'], 'window.location.protocol') ?>;
 newSrc += "//";
 newSrc += <?php echo isset_or_je($_GET['hostname'], 'window.location.hostname') ?>;
 newSrc += <?php echo isset_or_je($_GET['port'], 'window.location.port') ?>;

 pathComponents = window.location.pathname.split('/');
 for(var i = 0; i < pathComponents.length - 1; i++)
 {
   newSrc += pathComponents[i] + "/";
 }

 newSrc += "<?php echo $_GET['relPath'] ?>";

 newElem.src = newSrc;

 attachPoint.appendChild(newElem);


})()
