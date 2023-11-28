// This worker messages how many connections have been made.
let connection_count = 0;
self.onconnect = (e) => {
    connection_count++;
    e.ports[0].postMessage(connection_count);
}
