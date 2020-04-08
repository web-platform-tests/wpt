document.write("FAIL\n");
document.close();

window.parent.document.dispatchEvent(new CustomEvent("testEnd"));
