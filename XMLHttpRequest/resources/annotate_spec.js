(function(){
    /*
    * Load JSON data about tests and assertations, annotate spec
    */
    var jsonURL = 'http://hallvord.com/temp/xhr/test_assertation_map.json';
    var xhr = new XMLHttpRequest(); // this is a bit meta, no? :)
    xhr.open('GET', jsonURL, true);
    xhr.responseType = 'json';
    xhr.onload = function(){
        console.log('xhr onload')
        console.log(xhr.response)
        document.head.appendChild(document.createElement('style')).textContent = '.test_annotation a:before{ content:"✦" } .seems_well_tested{ background: #f2fff2 }';
        for(var i=0, item, id, elm; item = xhr.response[i]; i++){
            id = item.linkhref.substr(item.linkhref.lastIndexOf('#') + 1);
            elm = document.getElementById(id);
            if(!elm){
                console.warn('No element found for ' + id + ', throwing away ' + item.xpaths.length + ' entries about '+ item.testURL);
                continue;
            }
            for(var j=0, assert_elm, xpath; xpath = item.xpaths[j]; j++){
                try{
                    assert_elm = document.evaluate("//*[@id='" + id + "']/"+xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                }catch(e){
                    console.warn('Exception thrown when evaluating ' + xpath + ' (relative to ' + id + '), not able to link this assertation to '+item.testURL);
                    continue;
                }
                assert_elm = assert_elm.singleNodeValue;
                if(!assert_elm){
                    console.warn('No element found for ' + xpath + ' (relative to ' + id + '), not able to link this assertation to '+item.testURL);
                    continue;
                }
                console.log(id+' '+elm)
                console.log(xpath)
                console.log(assert_elm)
                assert_elm.classList.add('seems_well_tested');
                var annotation = assert_elm.getElementsByClassName('test_annotation')[0] || document.createElement('span');
                annotation.className = 'test_annotation';
                annotation.appendChild(document.createElement('a')).href = item.testURL;
                annotation.lastChild.textContent = '[T]';
                if(!annotation.parentElement){
                    if(assert_elm.childElementCount === 1 && assert_elm.firstElementChild.tagName === 'P'){ // we have for example a <li><p> where the real assertation is inside the P
                        assert_elm.firstElementChild.appendChild(annotation)
                    }
                    else if(assert_elm.appendChild){
                        assert_elm.appendChild(annotation);
                    }
                    else if(assert_elm.nextSibling){
                        assert_elm.parentElement.insertBefore(annotation, assert_elm.nextSibling);
                    }else{
                        assert_elm.parentElement.appendChild(annotation);
                    }
                }
            }
        }
    }
    xhr.onerror = function(){alert('Failed to load annotation data from '+jsonURL)}
    xhr.send();
})()

