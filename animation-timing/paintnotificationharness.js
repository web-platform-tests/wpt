/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/


var reqAnimAPI = window.requestAnimationFrame;
var cancelAnimAPI = window.cancelRequestAnimationFrame;

var skip_all_tests = false;
var feature_check = false;
var BailEarly = null;

var old_test = test;
test = function(func, msg)
{
    if ((null == BailEarly) && (reqAnimAPI == undefined))
    {
        BailEarly = (reqAnimAPI == undefined) ? true : false;
        //We haven't yet printed the window.requestAnimationFrame undefined error
        old_test(function() { assert_true(reqAnimAPI !== undefined, msg); }, msg);
    }

    if (!BailEarly)
    {
        old_test(func, msg);
    }
}

function test_paint_interface()
{
    test(function()
    {
        assert_true(reqAnimAPI !== undefined &&
                    reqAnimAPI != null,
                    "window.requestAnimationFrame is defined and not null.");
    }, "window.requestAnimationFrame is defined and not null.");

    test(function()
    {
        assert_true(cancelAnimAPI !== undefined &&
                    cancelAnimAPI != null,
                    "window.cancelRequestAnimationFrame is defined and not null.");
    }, "window.cancelRequestAnimationFrame is defined and not null.");
}




//Animation globals
var startTime;
var obj1; //animation object

//Callback globals
var runCancelled = false;
var callbackCount = 0;
var multCallbackCount = 3;
var expCallbackCount = 6;

//Paint alignment to refresh rate globals
var defaultRefresh = 60;
var delta = 5; //Allowed delta from 60Hz
var it = 0;
var refresh = 0;
var SampleSize = 5; //Number of 1 second FPS samplings
var Sample; //current sample

function RunTests()
{
    //Start Animation while performing tests
    obj1 = document.getElementById("div1");
    obj1.style.left = "0px";
    startTime = new Date();
    reqAnimAPI(step);

    //Perform tests
    var handle = reqAnimAPI(Callback); //#1 callback
    var handleMsg = "window.requestAnimationFrame returns a callback handle.";
    test(function(){assert_true(handle !== undefined, handleMsg);}, handleMsg);

    
    //requestAnimationFrame allows inline script. #2 callback
    reqAnimAPI(function foo()
    {
        callbackCount++;
        var msg = "window.requestAnimationFrame accepts inline script. " +
                      "Callback " + callbackCount + " of " + expCallbackCount;
        test(function(){ assert_true(true, msg); }, msg);
    });

    
    //requestAnimationFrame does not accept optional args
    reqAnimAPI(CallbackOptArgs, "foo"); //#3 callback

    
    //register for multiple same callbacks.  #4 to 4+expCallbackCount
    //AddNote("#C0C0C0", "Queueing " + multCallbackCount + " multiple same callback attempts.");
    for (var i = 0; i < multCallbackCount; i++)
    {
        reqAnimAPI(MultCallbacks);
    }

    //register another callback and then cancel it.
    //the callback count should not increase
    var temp = reqAnimAPI(CancelledCallback);
    if (cancelAnimAPI)
    {
        cancelAnimAPI(temp);
    }
    else
    {
        var msg = "cancelRequestAnimationFrame is not defined.  Cannot perform cancel test.";
        test(function() { assert_true(false, msg); }, msg); 
    }

    //Schedule this verification before the final verification.  This should fire first.
    setTimeout(function()
               {
                   var msg = "window.cancelRequestAnimationFrame cancels callbacks.";
                   test(function(){ assert_false(runCancelled, msg); }, msg);
                                
               }, 100); // 100 ~= 16.6 ms per 60Hz frame * 6 expected callbacks
    
    setTimeout(function()
               {
                    var msg = "window.requestAnimationFrame calls all expected callbacks.";
                    test(function(){ assert_equals(callbackCount, expCallbackCount, msg); }, msg);
                    
               }, 100); // 100 ~= 16.6 ms per 60Hz frame * 6 expected callbacks
}


/*
// ========================================================== //
//  Animation routine
// ========================================================== //
*/
function step(timestamp)
{
    var rate = 10;
    var width = 1000;
    var progress = timestamp - startTime;
    obj1.style.left = Math.min(progress / rate, width) + "px";
    if (progress < (width * rate))
    {
        reqAnimAPI(step);
    }
}

/*
// ========================================================== //
//  Callback general verification
// ========================================================== //
*/

function Callback(timestamp)
{
    callbackCount++;
    
    var msg1 = "window.requestAnimationFrame queues a callback.";
    test(function(){ assert_true(true, msg1); }, msg1);
    
    //Check that requestAnimationFrame has a timestamp
    var callbackTime = new Date(timestamp);

    var msg2 = "window.requestAnimationFrame contains a valid timestamp: " +
               callbackTime.toTimeString();
    test(function(){ assert_not_equals(callbackTime.valueOf(), NaN, msg2); }, msg2);
}

function MultCallbacks(timestamp)
{
    callbackCount++;
    var msg = "Multiple same callback registrations occur. " +
              "Callback " + callbackCount + " of " + expCallbackCount;
    test(function(){ assert_true(true, msg); }, msg);
}

function CallbackOptArgs(timestamp, arg)
{
    callbackCount++;
   
    var msg1 = "window.requestAnimationFrame performs callback when optional arguments are passed. " +
               "Callback " + callbackCount + " of " + expCallbackCount;
    test(function(){ assert_true(true, msg1); }, msg1);

    var msg2 = "window.requestAnimationFrame ignores optional passed arguments.";
    test(function(){ assert_true(arg == undefined, msg2); }, msg2);
}

function CancelledCallback(timestamp)
{
    callbackCount++;
    runCancelled = true;

    var msg = "window.cancelRequestAnimationFrame not honored. Callback still occurred.";
    test(function(){ assert_false(true, msg); }, msg);
}


/*
// ========================================================== //
//  Callback alignment to paint heart beat functions
// ========================================================== //
*/
Sample = 0;
function CallbackAlignment()
{
    it = 0;
    reqAnimAPI(align);
    setTimeout(Calculate, 1000); //Calculate the frames every second
}

function align(timestamp)
{
    //Don't do anything but iterate so as to not consume time within the frame
    it++;
    reqAnimAPI(align);
}

function Calculate()
{
    //Throw away the first sample
    if (Sample != 0)
    {
        var report = it - refresh;
        test_within_delta(report,
                          defaultRefresh,
                          delta,
                          "window.requestAnimationFrame aligns with the paint heartbeat: " + report);
    }

    refresh = it;
    
    //Restart animation
    if (Sample++ < (SampleSize + 1)) //+1 because we throw away the first sample
    {
        CallbackAlignment();
    }
}

function test_within_delta(value, base, delta, msg)
{
    test(function()
    {
        assert_true((value <= (base + delta)) && (value >= (base - delta)), msg);
    }, msg);
}