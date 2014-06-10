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

var indexSelected = -2;
var optionIFrame = null;

function start()
{
  var testList = document.getElementById("testList");
  for(var i in tests)
  {
    var test = tests[i];
    
    var testLink = document.createElement("a");
    testLink.href = "javascript:startTest("+i+")";
    testLink.className = "button";
    testLink.innerText = test;
    testLink.id = "test_"+i;
    
    var testElement = document.createElement("div");
    testElement.appendChild(testLink);
    
    testList.appendChild(testElement);
  }

  optionIFrame = document.getElementById("optionIFrame");

  // focusItem(indexSelected);
}

function focusItem(item)
{
  document.getElementById("test_"+item).focus();
  indexSelected = item;
}

function toggleIFrame()
{
  optionIFrame.checked = !optionIFrame.checked;
}

function startTest(index)
{
  var url = "index.html?autorun=1&path=/"+tests[index];
  if(optionIFrame.checked) {
    url += "&iframe=1";
  }
  document.location.href = url;
}

function onKey(e)
{
  switch(e.keyCode)
  {
    case 38 /* "ArrowUp" */:
      if(indexSelected > -1) {
        focusItem(indexSelected - 1);
      } else if (-2 == indexSelected) {
        focusItem(-1);
      }
      break;
      
    case 40 /* "ArrowDown" */:
      if(indexSelected < tests.length - 1) {
        focusItem(indexSelected + 1);
      }
      break;
      
    case 13 /* "Return" */:
      if(indexSelected >= 0) 
      {
        startTest(indexSelected);
      } else if(-1 == indexSelected) {
        toggleIFrame();
      }
      break;

    default:
      return true;
  }
  
  return false;
}