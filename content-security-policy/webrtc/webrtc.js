
// Creates two RTCPeerConnection and tries to connect them. Returns
// "allowed" if the connection is permitted, "blocked" if it is
// blocked on both sides and "inconsistent" in the even that the
// result is the same on both sides (should never happen).
async function tryConnect() {
    const iceServers = [{urls: "stun:stun.l.google.com:19302"}];
    const pc1 = new RTCPeerConnection({iceServers});
    const pc2 = new RTCPeerConnection({iceServers});

    // Returns a promise which resolves to a boolean which is true
    // if and only if pc.iceConnectionState settles in the "failed"
    // state, and never transitions to any state other than "new"
    // or "failed."
    const pcFailed = (pc) => {
        pc.onicecandidate = ({candidate}) => {
            pc.addIceCandidate(candidate);
        };
        return new Promise((resolve, _reject) => {
            pc.onicegatheringstatechange = (e) => {
                if(pc.iceGatheringState === "complete") {
                    resolve(pc.iceConnectionState === "failed");
                } else if(pc.iceConnectionState !== "new") {
                    resolve(false);
                }
            };
        });
    }
    pc1Failed = pcFailed(pc1);
    pc2Failed = pcFailed(pc2);

    // Creating a data channel is necessary to induce negotiation:
    const channel = pc1.createDataChannel('test');

    // Usual webrtc signaling dance:
    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(pc1.localDescription);
    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(pc2.localDescription);

    const failed1 = await pc1Failed;
    const failed2 = await pc2Failed;
    if(failed1 && failed2) {
        return 'blocked';
    } else if(!failed1 && !failed2) {
        return 'allowed';
    } else {
        return 'inconsistent';
    }
}

async function expectAllow() {
    promise_test(async () => assert_equals(await tryConnect(), 'allowed'));
}

async function expectBlock() {
    promise_test(async () => assert_equals(await tryConnect(), 'blocked'));
}

// vim: set ts=4 sw=4 et :
