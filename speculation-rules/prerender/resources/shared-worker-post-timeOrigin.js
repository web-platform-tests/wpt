onconnect = ({ports: [port]}) => 
    port.postMessage(performance.timeOrigin);

