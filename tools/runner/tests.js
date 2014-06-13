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
var firstOption = -1;
var optionIFrame = null;

function start()
{
  var testList = document.getElementById("testList");
  for(var i in tests)
  {
    var test = tests[i];
    
    var testLink = document.createElement("a");
    testLink.href = "#";
    testLink.className = "list-group-item";
    testLink.innerText = test;
    testLink.id = "test_"+i;
    testLink.addEventListener('click', function (event) 
    {
      var index = i;
      startTest(index);
    });
    
    var testElement = document.createElement("div");
    testElement.appendChild(testLink);
    
    testList.appendChild(testLink);
  }

  optionIFrame = document.getElementById("optionIFrame");

  // focusItem(indexSelected);
}

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
  if(false == isElementInViewport(selectedElement)) {
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

function onKey(e)
{
  switch(e.keyCode)
  {
    case 38 /* "ArrowUp" */:
      if(indexSelected > -1) {
        focusItem(indexSelected - 1, true);
      } else if (-2 == indexSelected) {
        focusItem(-1);
      }
      break;
      
    case 40 /* "ArrowDown" */:
      if(indexSelected < tests.length - 1) {
        focusItem(indexSelected + 1, false);
      }
      break;
      
    case 13 /* "Return" */:
    case 32 /* "Space" */:
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