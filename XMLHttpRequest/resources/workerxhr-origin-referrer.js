// This simply posts a message to the owner page with the contents of the Referer header
var xhr=new XMLHttpRequest()
xhr.onreadystatechange = function(){
	if(xhr.readyState == 4){
		var obj = {test:'Referer header', result:xhr.responseText}
		self.postMessage(obj)
	}
}
xhr.open('GET', 'inspect-headers.php?filter_name=referer', true)
xhr.send()

// This simply posts a message to the owner page with the contents of the Origin header
var xhr2=new XMLHttpRequest()
xhr2.onreadystatechange = function(){
	if(xhr2.readyState == 4){
		var obj = {test:'Origin header', result:xhr2.responseText}
		self.postMessage(obj)
	}
}
xhr2.open('GET', 'inspect-headers.php?filter_name=origin', true)
xhr2.send()

// If "origin" / base URL is the origin of this JS file, we can load files 
// from the server it originates from.. and requri.php will be able to tell us
// what the requested URL was
var xhr3=new XMLHttpRequest()
xhr3.onreadystatechange = function(){
	if(xhr3.readyState == 4){
		var obj = {test:'Request URL test', result:xhr3.responseText}
		self.postMessage(obj)
	}
}
xhr3.open('GET', 'requri.php?full', true)
xhr3.send()

// On the other hand, when the origin is the origin of this script,
// we should not be allowed to load the URL of the owner page..
// this code requests a URL that gets passed from the owner page,
// i.e. one of the owner's origin, and is expected to throw
self.onmessage = function(e){
	if(e && e.url){
		var xhr4 = new XMLHttpRequest()
		xhr4.open('GET', e.url, true)
		xhr4.onreadystatechange = function(){
			if(xhr4.readyState == 4){
				self.postMessage({test: 'Request URL test 2', result:'Reached unreachable code'})
			}
		}
		try{
			xhr4.send()
		}catch(e){
			self.postMessage({test: 'Request URL test 2', result:'PASSED'})
		}
	}
}