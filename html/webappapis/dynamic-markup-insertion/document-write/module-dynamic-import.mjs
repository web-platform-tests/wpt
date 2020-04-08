document.write("PASS\n");
document.close();

window.parent.document.dispatchEvent(new CustomEvent("testEnd"));
