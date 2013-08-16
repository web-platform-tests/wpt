var http = require('http');

var server = http.createServer(function(request, response) {
    response.writeHead(404);
    response.end();
});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

/**
 * Import websocket module
 * on the server HTTP
 */
var WebSocketServer = require('websocket').server;

/**
 * Create the websocket server
 */
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

/**
 * Declare the variable connections for rooms and users
 */
var connections = new Array();

/**
 * When a peer connects
 */
wsServer.on('request', function(request) {

    /**
     * Accept the connection
     */
    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');

    /**
     * When we receive signal message from the client
     */
    connection.on('message', function(message) {
        message = JSON.parse(message.utf8Data);
        switch(message["type"]) {
            /**
             * When a peer send a SDP message broadcast it
             */
            case "candidate" : 
                console.log(message);
                //broadcast logic
            break;
        }
    });


    /**
     * When the peer hang up
     * broadcast bye signal
     */
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

})