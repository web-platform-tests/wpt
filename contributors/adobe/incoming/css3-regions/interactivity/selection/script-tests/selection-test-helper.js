var testTimeout = 10000;
  
setup({timeout: testTimeout});

if (window.testRunner)
{
	testRunner.dumpEditingCallbacks();
	dumpAsText(false);
}

var inSelectionTests = [];
var automateMouseMove = true;

function runSelectionTest()
{
	var selectionTest = async_test("Text was selected", {timeout: testTimeout});
    selectionTest.step( function() 
    {
		var endSelection = document.getElementById("endSelect");
		
	    endSelection.onmouseup = selectionTest.step_func( function(evt)
	    {
			console.log("mouseup event fired");

			/* Verify something got selected */
	        var selectedText = getCurrentSelectedText(); 
	        assert_not_equals(selectedText, "");

	        /* Verify the selected text is everything between the start and end points */
	        test( function() { verifySelectedText() }, "Selected text is correct" );
	
			/* Check for specific things in the selection */
			for(var i=0; i < inSelectionTests.length; i++)
			{
				if( inSelectionTests[i].nodeName )
				{
					var nodeName = inSelectionTests[i].nodeName
					var nodeExp = inSelectionTests[i].expected;
					var msg = nodeName + " is " + (nodeExp == true ? "" : "not ") + "in selection";
					test( function(){ assert_equals(isNodeInSelection(nodeName), nodeExp) }, msg);
				}
				else if( inSelectionTests[i].string )
				{
					var strToCheck = inSelectionTests[i].string;
					var strExp = inSelectionTests[i].expected;
					var msg = "'"+strToCheck+ "' is " + (strExp == true ? "" : "not ") + "in selection";
					test( function(){ assert_equals(isStringInSelection(strToCheck), strExp) }, msg);
				}
			}

	        selectionTest.done();
		});

		setSelection("startSelect", "endSelect");
	});
}

function setSelection(start, end)
{
	if(window.testRunner)
   	{
		var startNode = document.getElementById(start);
	    var endNode = document.getElementById(end); 
		
		var xStartPosition = startNode.getBoundingClientRect().left
		var yStartPosition = startNode.getBoundingClientRect().top
	
		var tmp = startNode.getBoundingClientRect();

		var xEndPosition = endNode.getBoundingClientRect().left
		var yEndPosition = endNode.getBoundingClientRect().top
	
		if( isTopToBottom(startNode, endNode) )
		{
			xEndPosition += endNode.getBoundingClientRect().width
		}
		else
		{
			xStartPosition += startNode.getBoundingClientRect().width
		}
	
		if(automateMouseMove)
		{
			eventSender.mouseMoveTo(xStartPosition, yStartPosition);
		    eventSender.mouseDown();
		
			var midPoint = document.getElementById("region-3");
			eventSender.mouseMoveTo(midPoint.getBoundingClientRect().left+5, midPoint.getBoundingClientRect().top+5 );
		
			eventSender.mouseMoveTo(xEndPosition, yEndPosition);
		    eventSender.mouseUp();
		}
		else
		{
			var range = document.createRange();
			range.setStart(startNode, 0);
			range.setEnd(endNode, 0);
		    
			var sel = window.getSelection();
			sel.removeAllRanges();
		    sel.addRange(range);
		}
		
		// Need to manually dispatch this event - it doesn't get 
		// sent otherwise when running in testRunner
		var mouseUpEvt = document.createEvent('MouseEvents');
		mouseUpEvt.initMouseEvent('mouseup',true,true,window,1,0,0,
		   					       xEndPosition,yEndPosition,
		   					       false,false,false,false,1,null);
	
		endNode.dispatchEvent(mouseUpEvt);
	}
}

function isTopToBottom(startPoint, endPoint)
{
	var start = document.createRange();
   	start.setStart(startPoint, 0);
   	start.setEnd(startPoint, 0);

	var end = document.createRange();
   	end.setStart(endPoint, 0);
   	end.setEnd(endPoint, 0);

	if( start.compareBoundaryPoints(Range.START_TO_END, end) < 0)
		return true;
	else 
		return false;
}

function getTextRange(start, end)
{
	var startNode = document.getElementById(start);
    var endNode = document.getElementById(end);

	var range = document.createRange();
	if(isTopToBottom(startNode, endNode))
	{
   		range.setStart(startNode, 0);
   		range.setEnd(endNode, 0);
	}
	else
	{
		range.setStart(endNode, 0);
   		range.setEnd(startNode, 0);
	}

	return range.toString().replace(/\n/g,"");
}
    
function getCurrentSelectedText()
{
    var currentSelection = "";
        
    var sel = window.getSelection();
    if (sel.rangeCount) 
    {
        for (var i = 0, len = sel.rangeCount; i < len; ++i) 
		{
			currRange = sel.getRangeAt(i);
            currentSelection += sel.getRangeAt(i).toString();
		}
    }
        
    return currentSelection.replace(/\n/g,"");
}

function verifySelectedText()
{
	var expectedStart = "";
	var expectedEnd = "";
	
	// Look for explict tags for the expected text.  
	// If not set, use the start and end selection points.
	if( document.getElementById("expectedStart") )
		expectedStart = "expectedStart";
	else
		expectedStart = "startSelect";
	
	if( document.getElementById("expectedEnd") )
		expectedEnd = "expectedEnd";
	else
		expectedEnd = "endSelect";
	  
	var expected = getTextRange(expectedStart, expectedEnd);
    var actual = getCurrentSelectedText();
    assert_equals(actual, expected);
}

function isStringInSelection(strToCheck)
{
	var sel = window.getSelection().getRangeAt(0);
	
	// If not, check for a substring
	if(sel.toString().indexOf(strToCheck) >= 0)
	 	return true;
	else
		return false;
}

function isNodeInSelection(toCheck)
{
	var sel = window.getSelection().getRangeAt(0);
	
	// If it's a node in the document, check the start & end points
	var nodeToCheck = document.getElementById(toCheck);
	var range = document.createRange()
	range.setStart(nodeToCheck, 0);
	range.setEnd(nodeToCheck, nodeToCheck.childNodes.length);
	
	var startToStart = sel.compareBoundaryPoints(Range.START_TO_START, range);
	var startToEnd = sel.compareBoundaryPoints(Range.START_TO_END, range);	
	var endToEnd = sel.compareBoundaryPoints(Range.END_TO_END, range);
	var endToStart = sel.compareBoundaryPoints(Range.END_TO_START, range);

	if(startToStart == startToEnd == endToEnd == endToStart)
		return false;
	else 
		return true;
}



