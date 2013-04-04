// Chargement des modules
var http = require('http');
var sys = require('sys');
var fs = require('fs');

// Creation du serveur d'écoute sur le port 8000
http.createServer(function(req, res) {
	
	console.log(req.url);
	console.log((req.url).indexOf("t00"));
	console.log(req.headers.accept);
	console.log(__dirname + req.url);
	console.log((req.url).substr(3));

	//debugHeaders(req);
	//*
  if (req.headers.accept && req.headers.accept == 'text/event-stream') {
    if (req.url.indexOf("t00") != -1) {
      sendSSE(req, res);
    } else {
      res.writeHead(404);
      res.end();
    }
  } 
  else {
  	if(req.url != "/favicon.ico"){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(fs.readFileSync(__dirname + req.url+".html"));
    res.end();
	 }
  }
  //*/
}).listen(8000);

function sendSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  var id = (new Date()).toLocaleTimeString();
	head = req.headers.accept;
	requrl = (req.url).substr(3);
  // Sends a SSE every 5 seconds on a single connection.
  setInterval(function() {
    constructSSE(res, id, (new Date()).getMinutes());
  }, 5000);
  constructSSE(res, id, (new Date()).getMinutes());
}

function constructSSE(res, id, data) {
  res.write('id: ' + id + '\n');
  res.write("data: " + data + '\n');

		switch(requrl){
			case "030":
				res.write("data: " + head + '\n\n');
			break;
	  		case "071":
	  			res.write(':data: colon caracter\n\n');
	  		break;
	  		case "072":
	  			res.write('data: one space character\n');
				res.write('data:  more spaces character\n\n');
			break;
	  		case "074":
	  			res.write('event: testevent\n');
	  			res.write('data: received\n\n');
	  		break;
	  		case "075":
	  			res.write('data: data buffer');
	  			res.write('data: no LF\n');
				res.write('data: one LF\n\n');
				res.write('data: two LF\n\n');
			break;
	  		case "076":
	  			res.write('id: ' +new Date().getSeconds()+ '\n');
	  			res.write('data: ' +data+ '\n\n');
			break;
	  		case "077":
  				setInterval(function () {
					sys.puts('Throwing error now.');
					throw new Error('User generated fault.');
				}, 1000);
  				res.write('retry: 2000\n\n');
  				res.write("data: else\n\n");
			break;
	  		case "078":
	  			res.write('other: other\n');
	  			res.write('data: test\n\n');
			break;
			default:
				res.write('\n');
			break;
	  	}
}

function debugHeaders(req) {
  sys.puts('URL: ' + req.url);
  for (var key in req.headers) {
    sys.puts(key + ': ' + req.headers[key]);
  }
  sys.puts('\n\n');
}