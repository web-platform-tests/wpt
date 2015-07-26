var t = async_test()
function setupTest( target, event, dataToPaste, externalPassCondition ){
    var logNode=document.getElementsByTagName('p')[0].firstChild;
  logNode.data='';
    if( typeof target==='string' ){
        if( target.indexOf('.')>-1 ){ // for example "myElementID.firstChild"
            var tmp=target.split('.');
            target=document.getElementById(tmp[0])[tmp[1]];
        }else{
            target=document.getElementById(target);
        }
    }
    /*  */
    if( target.addEventListener ){
        target.addEventListener(event, intermediateListener, false);
    }else if(target.attachEvent){
    target.attachEvent('on'+event, intermediateListener);
  }
    if( dataToPaste || event==='paste' ){
        logNode.data+='Please place this on the clipboard before continuing the test: "'+(dataToPaste || 'clipboard text' )+'"\n';
    logNode.parentNode.style.whiteSpace='pre';
        if(dataToPaste.indexOf('{')==0){ // sorry about the content sniffing, this is likely a JSON string with alternate clipboard formats
            if(dataToPaste.indexOf('text/html')>-1){
                logNode.parentNode.appendChild(document.createElement('br'));
                logNode.parentNode.appendChild(document.createTextNode('Note: copy all body text from '));
                var tmp=logNode.parentNode.appendChild(document.createElement('a'));
                tmp.href='support/html_file.htm';
                tmp.appendChild(document.createTextNode('this support file'));
                logNode.parentNode.appendChild(document.createTextNode(' for this test.'));
            }
        }
    }
    if(typeof triggerTestManually==='function'){
        /* Tests that require user interaction define a "triggerTestManually()" function.
        These are for example tests that rely on trusted events. */
        logNode.parentNode.appendChild(document.createTextNode('  '));
        var btn = logNode.parentNode.appendChild(document.createElement('button'))
        btn.type = 'button';
        btn.onclick = t.func_step(function(){
            triggerTestManually(event);
            btn.parentNode.removeChild(btn);
        });
        btn.appendChild(document.createTextNode(' Click here to run test: '));
    }else{
        logNode.data+='Test in progress, waiting for '+event+' event';
    }
    if(typeof onTestSetupReady==='function'){
        onTestSetupReady(event);
    }

    function intermediateListener(e){
        e=e||window.event;
    if(!e.target)e.target=e.srcElement;
    if(typeof window.clipboardData != 'undefined' && typeof e.clipboardData=='undefined' )e.clipboardData=window.clipboardData;
        try{
            var testResult=clipboard_api_test(e);
            result(testResult);
        }catch(e){
            result('exception: '+e);
        }
    }
  /* if @autofocus isn't supported.. */
  if( document.getElementsByTagName('input').length >1 && document.activeElement == document.body  ){
    for(var inp, i=0, inputs=document.getElementsByTagName('input');inp=inputs[i];i++){
      if(inp.hasAttribute('autofocus'))inp.focus();
    }
  }
}

function result(testResult, msg){
    var logNode=document.getElementsByTagName('p')[0].firstChild;
    if( testResult === true || testResult === false ){
        t.step(function(){assert_true(testResult)});
        t.done();
        logNode.data= '';
    }else if( typeof testResult === 'function' ){
        t.step(testResult);
        t.done();
        logNode.data= '';
    }else if( typeof testResult ==='string' ){
        logNode.data=testResult;
    }else if( typeof externalPassCondition==='string' ){
        logNode.data='\nThis test passes if this text is now on the system clipboard: "'+externalPassCondition+'"';
        var btn = document.getElementById('log').appendChild(document.createElement('button'));
        btn.onclick = function(){result(true)};
        btn.textContent = 'Passed!';
        btn.type='button';
        btn = document.getElementById('log').appendChild(document.createElement('button'));
        btn.onclick = function(){result(false)};
        btn.textContent = 'Failed!';
        btn.type='button';
    }
  if( msg )logNode.data+='\n'+msg;

    /* another return value - or no return - from test() indicates that it is asyncronous and will call testResult() from a timeout or something */

}
