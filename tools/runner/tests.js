/*jslint browser: true, sloppy: true, vars: true, white: true, indent: 2 */

var tests = [
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

var optionIndexIFrame = -1;

var firstOption = optionIndexIFrame;
var lastOption = optionIndexIFrame;

var optionIFrame = null;

function isElementInViewport (el) 
{
  var rect = el.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
  );
}

function focusItem(item, scrollToTop)
{
  if(indexSelected >= firstOption) {
    document.getElementById("test_"+indexSelected).classList.remove("active");
  }
  
  var selectedElement = document.getElementById("test_"+item);
  if(false === isElementInViewport(selectedElement)) {
    selectedElement.scrollIntoView(scrollToTop);
  }
  selectedElement.classList.add("active");
  
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
  
  return true;
}

function installHandler(testLink, i)
{
  testLink.addEventListener('click', function () 
  {
    startTest(i);
  });
}

function start()
{
  var testList = document.getElementById("testList");
  var i;
  
  for(i = 0; i < tests.length; i++)
  {
    var test = tests[i];
    
    var testLink = document.createElement("a");
    testLink.href = "#";
    testLink.className = "list-group-item";
    testLink.innerText = test;
    testLink.id = "test_"+i;
    installHandler(testLink, i);

    var testElement = document.createElement("div");
    testElement.appendChild(testLink);
    
    testList.appendChild(testLink);
  }

  optionIFrame = document.getElementById("optionIFrame");

  // focusItem(indexSelected);
}

function onKey(e)
{
  switch(e.keyCode)
  {
    case 38 /* "ArrowUp" */:
      if(indexSelected > firstOption) {
        focusItem(indexSelected - 1, true);
      } else if ((firstOption - 1) === indexSelected) {
        focusItem(firstOption);
      }
      break;
      
    case 40 /* "ArrowDown" */:
      if(indexSelected < tests.length - 1) {
        focusItem(indexSelected + 1, false);
      }
      break;
      
    case 13 /* "Return" */:
    case 32 /* "Space" */:
      if(indexSelected > lastOption) 
      {
        startTest(indexSelected);
      } else if(optionIndexIFrame === indexSelected) {
        toggleIFrame();
      }
      break;

    default:
      return true;
  }
  
  return false;
}

