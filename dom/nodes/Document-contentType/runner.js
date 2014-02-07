// Runner script for individual test cases
var runnerResultSent = false, runnerResultTimeout;
function runnerResult(status, log) {
  if(runnerResultTimeout) 
   	clearTimeout( runnerResultTimeout );
  if(!runnerResultSent) {
    try{
      top.opener.rr( status, log );
    } catch (e) {}
    runnerResultSent = true;
  }
}
function overrideCurrentRunner(func, timeout) {
	if(runnerResultTimeout) 
		clearTimeout( runnerResultTimeout );
    runnerResultTimeout = setTimeout( func, timeout || 2000 );
}
runnerResultTimeout = setTimeout(function() {
	runnerResult(undefined, "script did not run.")
}, 4000 ); // default runner timeout