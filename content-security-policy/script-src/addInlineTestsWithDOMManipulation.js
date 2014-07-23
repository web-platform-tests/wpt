(function () 
{ 
 var attachPoint = document.getElementById('attachHere');

 var inlineScript = document.createElement('script');
 var scriptText = document.createTextNode('test(function() {assert_false(true, "Unsafe inline script ran - createTextNode.")});');

 inlineScript.appendChild(scriptText);

 attachPoint.appendChild(inlineScript);

 document.getElementById('emptyScript').innerHTML = 'test(function() {assert_false(true, "Unsafe inline script ran - innerHTML.")});';

 // Note, this doesn't execute in Chrome 27 even without CSP.
 document.getElementById('emptyDiv').outerHTML = '<script id=outerHTMLScript>test(function() {assert_false(true, "Unsafe inline script ran - outerHTML.")});</script>';

 
 document.write('<script>test(function() {assert_false(true, "Unsafe inline script ran - document.write")});</script>');
 document.writeln('<script>test(function() {assert_false(true, "Unsafe inline script ran - document.writeln")});</script>');
 

})();