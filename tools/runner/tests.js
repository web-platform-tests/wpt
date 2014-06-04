tests = [
  "2dcontext",
  "cors",
  "custom-elements",
  "dom",
  "DOMEvents",
  "domparsing",
  "domxpath",
  "eventsource",
  "ext-xhtml-pubid",
  "FileAPI",
  "html",
  "html-imports",
  "microdata",
  "page-visibility",
  "pointerlock",
  "progress-events",
  "selectors-api",
  "typedarrays",
  "url",
  "webgl",
  "websockets",
  "webstorage",
  "workers",
  "XMLHttpRequest"
];

var indexSelected = -1;

function start()
{
  var testList = document.getElementById("testList");
  for(var i in tests)
  {
    var test = tests[i];
    
    var testLink = document.createElement("a");
    testLink.href = "index.html?autorun=1&path=/"+test;
    testLink.className = "button";
    testLink.innerText = test;
    testLink.id = "test_"+i;
    
    var testElement = document.createElement("div");
    testElement.appendChild(testLink);
    
    testList.appendChild(testElement);
  }
  
  // focusItem(indexSelected);
}

function focusItem(item)
{
  document.getElementById("test_"+item).focus();
  indexSelected = item;
}

function onKey(e)
{
  switch(e.keyCode)
  {
    case 38 /* "ArrowUp" */:
      if(indexSelected > 0) {
        focusItem(indexSelected - 1);
      } else if (-1 == indexSelected) {
        focusItem(0);
      }
      break;
      
    case 40 /* "ArrowDown" */:
      if(indexSelected < tests.length - 1) {
        focusItem(indexSelected + 1);
      }
      break;
      
    case 13 /* "Return" */:
      if(-1 != indexSelected) {
        document.location.href = document.getElementById("test_"+indexSelected).href;
      }
      break;

    default:
      return true;
  }
  
  return false;
}