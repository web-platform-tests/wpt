// Helper function to connect to the echo endpoint
// Assumes that pc.localDescription is already set and generates an answer.
async function connect(pc) {
    const {protocol} = window.location;
    const ws = new WebSocket((protocol === 'http:' ? 'ws:' : 'wss:') + '//' + window.location.hostname + ':4404/webrtc');
    ws.binaryType = 'arraybuffer';

    await (new Promise((resolve) => {
        ws.addEventListener('open', resolve);
    }))

    await pc.setLocalDescription();
    // wait for ICE gathering to complete
    await (new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') {
            resolve();
        } else {
            pc.addEventListener('icegatheringstatechange', function listener() {
                if (pc.iceGatheringState === 'complete') {
                    pc.removeEventListener('icegatheringstatechange', listener);
                    resolve();
                }
            });
        }
    }));
    const offer = pc.localDescription;
    const sections = SDPUtils.splitSections(offer.sdp);
    const dtls = SDPUtils.getDtlsParameters(sections[1], sections[0]);
    const ice = SDPUtils.getIceParameters(sections[1], sections[0]);
    const candidates = SDPUtils.matchPrefix(sections[1], 'a=candidate:')
        .map(line => line.substr(2));
    ws.send(JSON.stringify({
        ice,
        dtls,
        candidates,
    }));

    const parameters = await (new Promise((resolve) => {
        ws.addEventListener('message', function listener(message) {
            ws.removeEventListener('message', listener);
            resolve(JSON.parse(message.data))
        });
    }));

    let sdp = 'v=0\r\n' +
        'o=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
        's=-\r\n' +
        't=0 0\r\n' +
        'm=video 9 UDP/TLS/RTP/SAVPF 100 101\r\n' +
        'c=IN IP4 0.0.0.0\r\n' +
        'a=rtcp:9 IN IP4 0.0.0.0\r\n' +
        'a=mid:0\r\n' +
        'a=sendrecv\r\n' +
        'a=rtcp-mux\r\n' +
        'a=rtcp-rsize\r\n' +
        'a=rtpmap:100 VP8/90000\r\n' +
        'a=rtpmap:101 rtx/90000\r\n' +
        'a=fmtp:101 apt=100\r\n';
    sdp += SDPUtils.writeDtlsParameters(parameters.dtls, 'active');
    sdp += SDPUtils.writeIceParameters(parameters.ice);
    parameters.candidates.forEach(c => sdp += 'a=' + c + '\r\n');

    if (SDPUtils.matchPrefix(offer.sdp, 'a=simulcast:').length) {
        // Simulcast offer, pretend there is an answer.
        const simulcastLine = SDPUtils.matchPrefix(offer.sdp, 'a=simulcast:')[0];
        sdp += 'a=simulcast:recv ' + simulcastLine.split(' ')[1] + '\r\n';
        sdp += SDPUtils.matchPrefix(offer.sdp, 'a=rid:').join('\r\n') + '\r\n';
        sdp += SDPUtils.matchPrefix(offer.sdp, 'a=extmap:').join('\r\n') + '\r\n';
    }
    await pc.setRemoteDescription({type: 'answer', sdp});
    return ws;
}

// Determine if a packet is an RTCP packet.
// See https://tools.ietf.org/html/rfc5761#section-4
function isRTCP(packet) {
    if (packet.byteLength < 1) {
        return false;
    }
    const view = new DataView(packet);
    const payloadType = view.getUint8(1) & 0x7f;
    return payloadType >= 72 && payloadType <= 79;
}

// RTP parser
function RTP(packet) {
    if (packet.byteLength < 12) {
        return;
    }
    const view = new DataView(packet);
    const firstByte = view.getUint8(0);
    if (firstByte >> 6 !== 2) {
        return;
    }

    let headerLength = 12;
    const contributingSources = [];
    if (firstByte & 0x0f) {
        let offset = headerLength;
        headerLength += 4 * (firstByte & 0x0f); // 12 + 4 * csrc count
        if (headerLength > packet.byteLength) {
            return;
        }
        while(offset < headerLength) {
            contributingSources.push(view.getUint32(offset));
            offset += 4;
        }
    }

    const headerExtensions = [];
    if (firstByte & 0x10) { // header extensions present.
        // https://tools.ietf.org/html/rfc3550#section-5.3.1
        if (headerLength + 4 > packet.byteLength) {
            return;
        }
        let offset = headerLength;
        headerLength += 4 + 4 * view.getUint16(headerLength + 2);
        if (headerLength > packet.byteLength) {
            return;
        }
        // https://tools.ietf.org/html/rfc5285#section-4.2
        if (view.getUint16(offset) === 0xbede) {
            offset += 4;
            while (offset < headerLength) {
                const extensionId = view.getUint8(offset) >> 4;
                if (extensionId === 15) {
                    break;
                }
                const length = (view.getUint8(offset) & 0xf) + 1;
                if (extensionId !== 0) {
                    headerExtensions.push({
                        id: extensionId,
                        data: new DataView(packet, offset + 1, length),
                    });
                }
                offset += length + 1;
            }
        } else {
            console.warn('TODO: parse two byte extensions');
        }
    }
    let bodyLength = packet.byteLength - headerLength;
    if (firstByte & 0x20) { // padding
        bodyLength -= view.getUint8(packet.byteLength - 1);
    }
    if (bodyLength < 0) {
        return;
    }
    const secondByte = view.getUint8(1);
    return {
        version: firstByte >> 6,
        padding: (firstByte >> 5) & 1,
        extension: (firstByte >> 4) & 1,
        marker: secondByte >> 7,
        payloadType: secondByte & 0x7f,
        sequenceNumber: view.getUint16(2),
        timestamp: view.getUint32(4),
        synchronizationSource: view.getUint32(8),
        header: new DataView(packet, 0, headerLength),
        contributingSources,
        headerExtensions,
        payload: new DataView(packet, headerLength, bodyLength),
    };
}
