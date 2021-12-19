const STORE_URL = '/speculation-rules/prerender/resources/key-value-store.py';

function assertSpeculationRulesIsSupported() {
  assert_implements(
      'supports' in HTMLScriptElement,
      'HTMLScriptElement.supports is not supported');
  assert_implements(
      HTMLScriptElement.supports('speculationrules'),
      '<script type="speculationrules"> is not supported');
}

// Starts prerendering for `url`.
function startPrerendering(url) {
  // Adds <script type="speculationrules"> and specifies a prerender candidate
  // for the given URL.
  // TODO(https://crbug.com/1174978): <script type="speculationrules"> may not
  // start prerendering for some reason (e.g., resource limit). Implement a
  // WebDriver API to force prerendering.
  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.text = `{"prerender": [{"source": "list", "urls": ["${url}"] }] }`;
  document.head.appendChild(script);
}

// Reads the value specified by `key` from the key-value store on the server.
async function readValueFromServer(key) {
  const serverUrl = `${STORE_URL}?key=${key}`;
  const response = await fetch(serverUrl);
  if (!response.ok)
    throw new Error('An error happened in the server');
  const value = await response.text();

  // The value is not stored in the server.
  if (value === "")
    return { status: false };

  return { status: true, value: value };
}

// Convenience wrapper around the above getter that will wait until a value is
// available on the server.
async function nextValueFromServer(key) {
  while (true) {
    // Fetches the test result from the server.
    const { status, value } = await readValueFromServer(key);
    if (!status) {
      // The test result has not been stored yet. Retry after a while.
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    return value;
  }
}

// Writes `value` for `key` in the key-value store on the server.
async function writeValueToServer(key, value) {
  const serverUrl = `${STORE_URL}?key=${key}&value=${value}`;
  await fetch(serverUrl);
}

// Loads the initiator page, and navigates to the prerendered page after it
// receives the 'readyToActivate' message.
function loadInitiatorPage() {
  // Used to communicate with the prerendering page.
  const prerenderChannel = new BroadcastChannel('prerender-channel');
  window.addEventListener('unload', () => {
    prerenderChannel.close();
  });

  // We need to wait for the 'readyToActivate' message before navigation
  // since the prerendering implementation in Chromium can only activate if the
  // response for the prerendering navigation has already been received and the
  // prerendering document was created.
  const readyToActivate = new Promise((resolve, reject) => {
    prerenderChannel.addEventListener('message', e => {
      if (e.data != 'readyToActivate')
        reject(`The initiator page receives an unsupported message: ${e.data}`);
      resolve(e.data);
    });
  });

  const url = new URL(document.URL);
  url.searchParams.append('prerendering', '');
  // Prerender a page that notifies the initiator page of the page's ready to be
  // activated via the 'readyToActivate'.
  startPrerendering(url.toString());

  // Navigate to the prerendered page after being informed.
  readyToActivate.then(() => {
    window.location = url.toString();
  }).catch(e => {
    const testChannel = new BroadcastChannel('test-channel');
    testChannel.postMessage(
        `Failed to navigate the prerendered page: ${e.toString()}`);
    testChannel.close();
    window.close();
  });
}

// Returns messages received from the given BroadcastChannel
// so that callers do not need to add their own event listeners.
// nextMessage() returns a promise which resolves with the next message.
//
// Usage:
//   const channel = new BroadcastChannel('channel-name');
//   const messageQueue = new BroadcastMessageQueue(channel);
//   const message1 = await messageQueue.nextMessage();
//   const message2 = await messageQueue.nextMessage();
//   message1 and message2 are the messages received.
class BroadcastMessageQueue {
  constructor(broadcastChannel) {
    this.messages = [];
    this.resolveFunctions = [];
    this.channel = broadcastChannel;
    this.channel.addEventListener('message', e => {
      if (this.resolveFunctions.length > 0) {
        const fn = this.resolveFunctions.shift();
        fn(e.data);
      } else {
        this.messages.push(e.data);
      }
    });
  }

  // Returns a promise that resolves with the next message from this queue.
  nextMessage() {
    return new Promise(resolve => {
      if (this.messages.length > 0)
        resolve(this.messages.shift())
      else
        this.resolveFunctions.push(resolve);
    });
  }
}

// Returns <iframe> element upon load.
function createFrame(url) {
  return new Promise(resolve => {
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.onload = () => resolve(frame);
      document.body.appendChild(frame);
    });
}

async function prerenderScript(script, t) {
  const id = token();
  const channelName = `prerender-channel-${id}`;
  const scriptElement = document.createElement('script');
  const wrapper = async (channelName, action) => {
    const channel = new BroadcastChannel(channelName);
    const log = (...args) => channel.postMessage({log: args});
    if (document.prerendering) {
      const result = await action({log});
      channel.postMessage({state: 'prerender', result});
      channel.addEventListener('message', ({data}) => {
        if (data.close)
          window.close();
      })
      document.addEventListener('prerenderingchange', async e => {
        channel.postMessage({state: 'reused'});
      })
    } else {
      channel.postMessage({state: 'discarded'});
    }
  }

  scriptElement.text = `(${wrapper.toString()})(
    ${JSON.stringify(channelName)},
    ${script.toString()})`;
  const content = `<!DOCTYPE html><body></body>
  ${scriptElement.outerHTML}`;
  const channel = new BroadcastChannel(channelName);
  const url = `/common/echo.py?content=${encodeURIComponent(content)}`
  const rulesElement = document.createElement('script');
  rulesElement.type = 'speculationrules';
  rulesElement.text = JSON.stringify({prerender: [{source: "list", urls: [url]}]});
  const loaderContent = `<!DOCTYPE html>
  <head>
    ${rulesElement.outerHTML}
    <script>
      const channel = new BroadcastChannel('${channelName}');
      channel.addEventListener('message' , ({data}) => {
        if (data.next)
          location.href = data.next;
      });
    </script>
  </head>`;
  const popup = window.open(`/common/echo.py?content=${encodeURIComponent(loaderContent)}`, '_blank', 'noopener');
  let resolve = null;
  channel.addEventListener('message', ({data}) => {
    console.log(data)
    if (Reflect.has(data, 'log'))
      console.log(...Array.from(data.log));
    else if (Reflect.has(data, 'state'))
      resolve(data);
  });
  const {state, result} = await new Promise(r => { resolve = r });

  assert_equals(state, 'prerender');
  const activate = async () => {
    channel.postMessage({next: url});
    const {result} = await new Promise(r => { resolve = r });
  }
  return {result, activate};
}