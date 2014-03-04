var src = "http://{{domains[www1]}}:{{ports[http][0]}}";
src += document.location.pathname.substring(0, document.location.pathname.lastIndexOf("/") + 1);
src += "test.html";
document.getElementById("fr2").src = src;
