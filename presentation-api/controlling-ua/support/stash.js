(window => {
  //
  // Common Parameters and Functions for test cases which use a stash
  //
  window.message1 = '1st';
  window.message2 = '2nd';
  window.message3 = new Uint8Array([51, 114, 100]);      // "3rd"
  window.message4 = new Uint8Array([52, 116, 104]);      // "4th"
  window.message5 = new Uint8Array([108, 97, 115, 116]); // "last"

  Uint8Array.prototype.toText = function() {
      return this.reduce(function(result, item) {
          return result + String.fromCharCode(item);
      }, '');
  };

  Uint8Array.prototype.equals = function(a) {
      let array = a instanceof Uint8Array ? a : (a instanceof ArrayBuffer ? new Uint8Array(a) : null);
      return !!array && this.every((item, index) => { return item === a[index]; });
  };

  ArrayBuffer.prototype.toText = function() {
      return new Uint8Array(this).toText();
  };

  ArrayBuffer.prototype.equals = function(a) {
      return new Uint8Array(this).equals(a);
  };

  // Note: Tentatively, Only one stash ID is defined, due to a single presentationUrls
  // common to any test cases
  const stashPath = '/presentation-api/controlling-ua/support/stash.py?id=';
  const stashId = '59d947f0-31ba-4bc3-8b28-691e6bbb05a9';

  // clean up a stash on wptserve
  window.initStash = () => {
    return fetch(stashPath + stashId).then(response => {
      return response.text();
    });
  };

  // upload a test result to a stash on wptserve
  window.uploadStash = result => {
    return fetch(stashPath + stashId, {
      method: 'POST',
      body: result
    }).then(response => {
      return response.text();
    }).then(text => {
      return text === 'ok' ? null : Promise.reject();
    })
  };

  // wait until a test result is uploaded to a stash on wptserve
  window.waitForStash = () => {
    return new Promise((resolve, reject) => {
      let intervalId;
      const interval = 500; // msec
      const polling = () => {
        return fetch(stashPath + stashId).then(response => {
          return response.text();
        }).then(text => {
          if(text) {
            resolve(text);
            clearInterval(intervalId);
          }
        });
      };
      intervalId = setInterval(polling, interval);
    });
  };

  // stop waiting for a stash on wptserve
  window.stopWaitingStash = () => {
    return fetch(stashPath + stashId, {
      method: 'POST',
      body: 'stopped'
    }).then(response => {
      return response.text();
    });
  }
})(window);