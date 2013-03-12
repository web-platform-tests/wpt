var testTimeout = 10000;
setup({timeout: testTimeout});

// This block is executed if running in WebKit's harness
if (window.testRunner) {
    testRunner.dumpAsText(false);
}

// Verify that CSS Regions are enabled in the browser.
// Divs will be horizontal if Regions are enabled.
// Divs will be vertical if Regions are not enabled.
function checkLeftPosition(elemID) {
    return document.getElementById(elemID).getBoundingClientRect().left;
}

function mouseClick(block) {
    if(window.testRunner) {
        var startNode = document.getElementById(block);
        var xStartPosition = startNode.getBoundingClientRect().left;
        var yStartPosition = startNode.getBoundingClientRect().top;
        eventSender.mouseMoveTo(xStartPosition, yStartPosition);
        eventSender.mouseDown();
        eventSender.mouseUp();
    }
}

function mouseDown(block) {
    if(window.testRunner) {
        var startNode = document.getElementById(block);
        var xStartPosition = startNode.getBoundingClientRect().left;
        var yStartPosition = startNode.getBoundingClientRect().top;
        eventSender.mouseMoveTo(xStartPosition, yStartPosition);
        eventSender.mouseDown();
    }
}

function mouseUp(block) {
    if(window.testRunner) {
        var startNode = document.getElementById(block);
        var xStartPosition = startNode.getBoundingClientRect().left;
        var yStartPosition = startNode.getBoundingClientRect().top;
        eventSender.mouseMoveTo(xStartPosition, yStartPosition);
        eventSender.mouseUp();
    }
}

function mouseDblClick(block) {
    if(window.testRunner) {
        var startNode = document.getElementById(block);
        var xStartPosition = startNode.getBoundingClientRect().left;
        var yStartPosition = startNode.getBoundingClientRect().top;
        eventSender.mouseMoveTo(xStartPosition, yStartPosition);
        eventSender.mouseDown();
        eventSender.mouseUp();
        eventSender.mouseDown();
        eventSender.mouseUp();
    }
}

function mouseMove(block) {
    if(window.testRunner) {
        var startNode = document.getElementById(block);
        var xStartPosition = startNode.getBoundingClientRect().left;
        var yStartPosition = startNode.getBoundingClientRect().top;
        eventSender.mouseMoveTo(xStartPosition, yStartPosition);
        eventSender.mouseMoveTo(xStartPosition+10, yStartPosition+10);
    }
}

function checkBackgroundColor(elemID) {
    var foo = window.getComputedStyle(document.getElementById(elemID)).backgroundColor;
    return window.getComputedStyle(document.getElementById(elemID)).backgroundColor;
}

function mouseOver(block) {
    if(window.testRunner) {
        var startNode = document.getElementById(block);
        var xStartPosition = startNode.getBoundingClientRect().left;
        var yStartPosition = startNode.getBoundingClientRect().top;
        eventSender.mouseMoveTo(xStartPosition, yStartPosition);
    }
}

function mouseOut(block) {
    if(window.testRunner) {
        eventSender.mouseMoveTo(0, 0);
    }
}

function completionCallback () {
    add_completion_callback(function (allRes, status) {
        console.log("Test run completed", allRes, status);
        if(status.status === 0){
            console.log("Tests ran successfully");
            //Update the message stating that tests are complete
            var msg = document.getElementById("msg");

            var complete = document.createElement("p");
            complete.innerHTML = "Tests are complete. All results in the Details section below should PASS.";
            complete.style.color = "blue";
            msg.appendChild(complete);
        } else {
            console.log("tests timed out");
        }
    });
}