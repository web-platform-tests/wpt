function sendRequest(method, uri, headers, data, onSuccess, onError) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (xhr.status === 200) {
      onSuccess(xhr.response);
    } else {
      if (onError) onError(xhr.status, xhr.response);
    }
  };
  xhr.onerror = function() {
    if (onError) onError();
  };
  xhr.open(method, WaveService.uriPrefix + uri, true);
  for (var header in headers) {
    xhr.setRequestHeader(header, headers[header]);
  }
  xhr.send(data);
  return xhr;
}

var WEB_ROOT = "{{WEB_ROOT}}"
var HTTP_PORT = "{{HTTP_PORT}}"
var HTTPS_PORT = "{{HTTPS_PORT}}"
var OPEN = "open";
var CLOSED = "closed";

var WaveService = {
  uriPrefix: WEB_ROOT,
  socket: {
    state: CLOSED,
    onMessage: function() {},
    onOpen: function() {},
    onClose: function() {},
    send: function() {},
    close: function() {},
    onStateChange: function() {}
  },
  // SESSIONS API
  createSession: function(configuration, onSuccess, onError) {
    var data = JSON.stringify({
      tests: configuration.tests,
      types: configuration.types,
      timeouts: configuration.timeouts,
      reference_tokens: configuration.referenceTokens,
      expiration_date: configuration.expirationDate,
      labels: configuration.labels
    });
    sendRequest(
      "POST",
      "api/sessions",
      { "Content-Type": "application/json" },
      data,
      function(response) {
        var jsonObject = JSON.parse(response);
        onSuccess(jsonObject.token);
      },
      onError
    );
  },
  readSession: function(token, onSuccess, onError) {
    sendRequest(
      "GET",
      "api/sessions/" + token,
      null,
      null,
      function(response) {
        var jsonObject = JSON.parse(response);
        onSuccess({
          token: jsonObject.token,
          tests: jsonObject.tests,
          types: jsonObject.types,
          userAgent: jsonObject.user_agent,
          labels: jsonObject.labels,
          timeouts: jsonObject.timeouts,
          browser: jsonObject.browser,
          isPublic: jsonObject.is_public,
          referenceTokens: jsonObject.reference_tokens,
          webhookUrls: jsonObject.webhook_urls,
          expirationDate: jsonObject.expiration_date
        });
      },
      onError
    );
  },
  readMultipleSessions: function(tokens, onSuccess, onError) {
    var requestsLeft = tokens.length;
    if (requestsLeft === 0) onSuccess([]);
    var configurations = [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      WaveService.readSession(
        token,
        function(configuration) {
          requestsLeft--;
          configurations.push(configuration);
          if (requestsLeft === 0) onSuccess(configurations);
        },
        function(status) {
          if (status === 404) requestsLeft--;
          if (status !== 404 && onError) onError();
          if (requestsLeft === 0) onSuccess(configurations);
        }
      );
    }
  },
  readSessionStatus: function(token, onSuccess, onError) {
    sendRequest(
      "GET",
      "api/sessions/" + token + "/status",
      null,
      null,
      function(response) {
        var jsonObject = JSON.parse(response);
        onSuccess({
          token: jsonObject.token,
          dateStarted: jsonObject.date_started,
          dateFinished: jsonObject.date_finished,
          testFilesCount: jsonObject.test_files_count,
          testFilesCompleted: jsonObject.test_files_completed,
          status: jsonObject.status
        });
      },
      function() {
        if (onError) onError();
      }
    );
  },
  readMultipleSessionStatuses: function(tokens, onSuccess, onError) {
    var requestsLeft = tokens.length;
    if (requestsLeft === 0) onSuccess([]);
    var statuses = [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      WaveService.readSessionStatus(
        token,
        function(status) {
          requestsLeft--;
          statuses.push(status);
          if (requestsLeft === 0) onSuccess(statuses);
        },
        function() {
          requestsLeft--;
          if (requestsLeft === 0) onSuccess(statuses);
        }
      );
    }
  },
  readPublicSessions: function(onSuccess, onError) {
    sendRequest(
      "GET",
      "api/sessions/public",
      null,
      null,
      function(response) {
        var jsonObject = JSON.parse(response);
        onSuccess(jsonObject);
      },
      onError
    );
  },
  updateSession: function(token, configuration, onSuccess, onError) {
    var data = JSON.stringify({
      tests: configuration.tests,
      types: configuration.types,
      timeouts: configuration.timeouts,
      reference_tokens: configuration.referenceTokens,
      expiration_date: configuration.expirationDate
    });
    sendRequest(
      "PUT",
      "api/sessions/" + token,
      { "Content-Type": "application/json" },
      data,
      function() {
        onSuccess();
      },
      onError
    );
  },
  updateLabels: function(token, labels, onSuccess, onError) {
    var data = JSON.stringify({ labels: labels });
    sendRequest(
      "PUT",
      "api/sessions/" + token + "/labels",
      { "Content-Type": "application/json" },
      data,
      function() {
        if (onSuccess) onSuccess();
      },
      onError
    );
  },
  findToken: function(fragment, onSuccess, onError) {
    sendRequest(
      "GET",
      "api/sessions/" + fragment,
      null,
      null,
      function(response) {
        var jsonObject = JSON.parse(response);
        onSuccess(jsonObject.token);
      },
      onError
    );
  },
  startSession: function(token, onSuccess, onError) {
    sendRequest(
      "POST",
      "api/sessions/" + token + "/start",
      null,
      null,
      function() {
        onSuccess();
      },
      onError
    );
  },
  pauseSession: function(token, onSuccess, onError) {
    sendRequest(
      "POST",
      "api/sessions/" + token + "/pause",
      null,
      null,
      function() {
        onSuccess();
      },
      onError
    );
  },
  stopSession: function(token, onSuccess, onError) {
    sendRequest(
      "POST",
      "api/sessions/" + token + "/stop",
      null,
      null,
      function() {
        onSuccess();
      },
      onError
    );
  },
  resumeSession: function(token, resumeToken, onSuccess, onError) {
    var data = JSON.stringify({ resume_token: resumeToken });
    sendRequest(
      "POST",
      "api/sessions/" + token + "/resume",
      { "Content-Type": "application/json" },
      data,
      function() {
        if (onSuccess) onSuccess();
      },
      function(response) {
        if (onError) onError(response);
      }
    );
  },
  deleteSession: function(token, onSuccess, onError) {
    sendRequest(
      "DELETE",
      "api/sessions/" + token,
      null,
      null,
      function() {
        onSuccess();
      },
      onError
    );
  },

  // TESTS API
  readNextTest: function(token, onSuccess, onError) {
    sendRequest(
      "GET",
      "api/tests/" + token + "/next",
      null,
      null,
      function(response) {
        var jsonObject = JSON.parse(response);
        onSuccess(jsonObject.next_test);
      },
      onError
    );
  },
  readLastCompletedTests: function(token, resultTypes, onSuccess, onError) {
    var status = "";
    if (resultTypes) {
      for (var i = 0; i < resultTypes.length; i++) {
        var type = resultTypes[i];
        status += type + ",";
      }
    }
    sendRequest(
      "GET",
      "api/tests/" + token + "/last_completed?status=" + status,
      null,
      null,
      function(response) {
        var tests = JSON.parse(response);
        var parsedTests = [];
        for (var status in tests) {
          for (var i = 0; i < tests[status].length; i++) {
            var path = tests[status][i];
            parsedTests.push({ path: path, status: status });
          }
        }
        onSuccess(parsedTests);
      },
      onError
    );
  },
  readMalfunctioningTests: function(token, onSuccess, onError) {
    sendRequest(
      "GET",
      "api/tests/" + token + "/malfunctioning",
      null,
      null,
      function(response) {
        var tests = JSON.parse(response);
        onSuccess(tests);
      },
      function(response) {
        var errorMessage = JSON.parse(response).error;
        onError(errorMessage);
      }
    );
  },
  updateMalfunctioningTests: function(
    token,
    malfunctioningTests,
    onSuccess,
    onError
  ) {
    var data = JSON.stringify(malfunctioningTests);
    sendRequest(
      "PUT",
      "api/tests/" + token + "/malfunctioning",
      { "Content-Type": "application/json" },
      data,
      function() {
        onSuccess();
      },
      function(response) {
        var errorMessage = JSON.parse(response).error;
        onError(errorMessage);
      }
    );
  },
	readAvailableApis: function(onSuccess, onError) {
		sendRequest(
			"GET",
			"api/tests/apis",
			null,
			null,
			function(response) {
				var apis = JSON.parse(response);
				onSuccess(apis);
			},
			function(response) {
				if(!onError) return;
				var errorMessage = JSON.parse(response).error;
				onError(errorMessage);
			}
		);
	},

  // RESULTS API
  createResult: function(token, result, onSuccess, onError) {
    sendRequest(
      "POST",
      "api/results/" + token,
      { "Content-Type": "application/json" },
      JSON.stringify(result),
      function() {
        onSuccess();
      },
      onError
    );
  },
  readResults: function(token, onSuccess, onError) {
    sendRequest(
      "GET",
      "api/results/" + token,
      null,
      null,
      function(response) {
        onSuccess(JSON.parse(response));
      },
      onError
    );
  },
  readResultsCompact: function(token, onSuccess, onError) {
    sendRequest(
      "GET",
      "api/results/" + token + "/compact",
      null,
      null,
      function(response) {
        var jsonObject = JSON.parse(response);
        onSuccess(jsonObject);
      },
      onError
    );
  },
  readResultComparison: function(tokens, onSuccess, onError) {
    var comparison = {};
    var fetchComplete = function(results) {
      comparison.total = {};
      for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var token = result.token;
        comparison[token] = {};
        for (var api in result) {
          if (api === "token") continue;
          comparison[token][api] = result[api].pass;
          if (!comparison.total[api]) {
            var total = 0;
            for (var status in result[api]) {
              total = total + result[api][status];
            }
            comparison.total[api] = total;
          }
        }
      }
      onSuccess(comparison);
    };
    var requestsLeft = tokens.length;
    if (requestsLeft === 0) onSuccess([]);
    var results = [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      (function(token) {
        WaveService.readResultsCompact(
          token,
          function(result) {
            requestsLeft--;
            result.token = token;
            results.push(result);
            if (requestsLeft === 0) fetchComplete(results);
          },
          function(responseStatus) {
            if (responseStatus === 404) requestsLeft--;
            if (status !== 404 && onError) onError();
            if (requestsLeft === 0) fetchComplete(results);
          }
        );
      })(token);
    }
  },
  downloadResults: function(token) {
    location.href = "api/results/" + token + "/export";
  },
  downloadApiResult: function(token, api) {
    location.href = "api/results/" + token + "/" + api + "/json";
  },
  downloadAllApiResults: function(token, api) {
    location.href = "api/results/" + token + "/json";
  },
  downloadReport: function(token, api) {
    location.href = "api/results/" + token + "/" + api + "/report";
  },
  importResults: function(data, onSuccess, onError) {
    sendRequest(
      "POST",
      "api/results/import",
      { "Content-Type": "application/octet-stream" },
      data,
      function(response) {
        var token = JSON.parse(response).token;
        onSuccess(token);
      },
      function(status, response) {
        var errorMessage;
        if (status === 500) {
          errorMessage = "Internal server error.";
        } else {
          errorMessage = JSON.parse(response).error;
        }
        onError(errorMessage);
      }
    );
  },
  readResultsConfig: function(onSuccess, onError) {
    sendRequest(
      "GET",
      "api/results/config",
      null,
      null,
      function(response) {
        var config = JSON.parse(response);
        onSuccess({
	      	importEnabled: config.import_enabled,
	      	reportsEnabled: config.reports_enabled
	      });
      },
      onError
    );
  },
  readReportUri: function(token, api, onSuccess, onError) {
    sendRequest(
      "GET",
      "api/results/" + token + "/" + api + "/reporturl",
      null,
      null,
      function(response) {
        var jsonObject = JSON.parse(response);
        onSuccess(jsonObject.uri);
      },
      onError
    );
  },
  downloadMultiReport: function(tokens, api) {
    location.href =
      "api/results/" + api + "/report?tokens=" + tokens.join(",");
  },
  readMultiReportUri: function(tokens, api, onSuccess, onError) {
    sendRequest(
      "GET",
      "api/results/" + api + "/reporturl?tokens=" + tokens.join(","),
      null,
      null,
      function(response) {
        var jsonObject = JSON.parse(response);
        onSuccess(jsonObject.uri);
      },
      onError
    );
  },
  downloadResultsOverview: function(token) {
    location.href = "api/results/" + token + "/overview";
  },

  // UTILITY
  addRecentSession: function(token) {
    if (!token) return;
    var state = WaveService.getState();
    if (!state.recent_sessions) state.recent_sessions = [];
    if (state.recent_sessions.indexOf(token) !== -1) return;
    state.recent_sessions.unshift(token);
    WaveService.setState(state);
  },
  addRecentSessions: function(tokens) {
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      WaveService.addRecentSession(token);
    }
  },
  getPinnedSessions: function() {
    var state = WaveService.getState();
    if (!state || !state.pinned_sessions) return [];
    return state.pinned_sessions;
  },
  addPinnedSession: function(token) {
    if (!token) return;
    var state = WaveService.getState();
    if (!state.pinned_sessions) state.pinned_sessions = [];
    if (state.pinned_sessions.indexOf(token) !== -1) return;
    state.pinned_sessions.unshift(token);
    WaveService.setState(state);
  },
  getRecentSessions: function() {
    var state = WaveService.getState();
    if (!state || !state.recent_sessions) return [];
    return state.recent_sessions;
  },
  setRecentSessions: function(sessionTokens) {
    var state = WaveService.getState();
    state.recent_sessions = sessionTokens;
    WaveService.setState(state);
  },
  removePinnedSession: function(token) {
    if (!token) return;
    var state = WaveService.getState();
    if (!state.pinned_sessions) return;
    var index = state.pinned_sessions.indexOf(token);
    if (index === -1) return;
    state.pinned_sessions.splice(index, 1);
    WaveService.setState(state);
  },
  removeRecentSession: function(token) {
    var state = WaveService.getState();
    if (!state.recent_sessions) return;
    var index = state.recent_sessions.indexOf(token);
    if (index === -1) return;
    state.recent_sessions.splice(index, 1);
    WaveService.setState(state);
  },
  getState: function() {
    if (!window.localStorage) return null;
    var storage = window.localStorage;
    var state = JSON.parse(storage.getItem("wave"));
    if (!state) return {};
    return state;
  },
  setState: function(state) {
    if (!window.localStorage) return null;
    var storage = window.localStorage;
    storage.setItem("wave", JSON.stringify(state));
  },
  connectWebSocket: function(token) {
    var protocol;
    if (location.protocol === "https:") {
      protocol = "wss";
    } else {
      protocol = "ws";
    }
    var url = protocol + "://" + location.host;
    console.log("Connecting web socket to" + url);
    var webSocket = new WebSocket(url);
    webSocket.onmessage = function(message) {
      WaveService.socket.onMessage(JSON.parse(message.data));
    };
    webSocket.onclose = function() {
      WaveService.socket.state = CLOSED;
      WaveService.socket.onStateChange(CLOSED);
      WaveService.socket.onClose();
    };
    webSocket.onopen = function() {
      WaveService.socket.state = OPEN;
      WaveService.socket.onStateChange(OPEN);
      WaveService.socket.onOpen();
      webSocket.send(JSON.stringify({ token: token }));
    };
    WaveService.socket.send = function(message) {
      webSocket.send(message);
    };
    WaveService.socket.close = function() {
      webSocket.close();
    };
  },
  connectHttpPolling: function(token) {
		var uniqueId = new Date().getTime()
    var poll = function() {
      var request = sendRequest(
        "GET",
        "api/sessions/" + token + "/events?id=" + uniqueId,
        null,
        null,
        function(response) {
          if (WaveService.socket.state === OPEN) poll();
          WaveService.socket.onMessage(JSON.parse(response));
        },
        function() {
          if (WaveService.socket.state === OPEN) setTimeout(poll, 1000);
        }
      );
      WaveService.socket.close = function() {
        request.abort();
        WaveService.socket.state = CLOSED;
        WaveService.socket.onStateChange(CLOSED);
        WaveService.socket.onClose();
      };
    };
    poll();
    WaveService.socket.onOpen();
    WaveService.socket.state = OPEN;
    WaveService.socket.onStateChange(OPEN);
  },
  connect: function(token) {
    if (window.WebSocket) {
      WaveService.connectWebSocket(token);
    } else {
      WaveService.connectHttpPolling(token);
    }
  },
  onMessage: function(callback) {
    WaveService.socket.onMessage = callback;
  },
  isConnected: function() {
    return WaveService.socket.state === OPEN;
  },
  openSession: function(token) {
    location.href = "/results.html?token=" + token;
  }
  // setDefaultToken(token) {
  //   WaveService.defaultToken = token;
  // },
  // getDefaultToken() {
  //   return WaveService.defaultToken;
  // },
  // sendRequest(method, uri, callback) {
  //   const xhr = new XMLHttpRequest();
  //   xhr.addEventListener("load", () => {
  //     let headers = {};
  //     let rawHeaders = xhr.getAllResponseHeaders();
  //     rawHeaders = rawHeaders.split("\r\n");
  //     rawHeaders.forEach(rawHeader => {
  //       const split = rawHeader.split(": ");
  //       headers[split.shift().toLowerCase()] = split.shift();
  //     });
  //     callback(xhr.response, headers);
  //   });
  //   xhr.open(method, uri, true);
  //   xhr.send();
  // },
  // getSession(token, callback, options) {
  //   if (typeof token !== "string") {
  //     callback = token;
  //     options = callback;
  //     token = WaveService.defaultToken;
  //   }
  //   const { detailsOnly } = options;
  //   let url = `api/sessions/${token}`;
  //   if (detailsOnly) url = `${url}/details`;
  //   WaveService.sendRequest("GET", url, response =>
  //     callback(response ? JSON.parse(response) : null)
  //   );
  // },

  // getSessionDetails(token, callback) {
  //   if (!token) {
  //     return WaveService.getSession(callback, { detailsOnly: true });
  //   }
  //   if (token instanceof Array) {
  //     return WaveService.getSessions(token, callback, { detailsOnly: true });
  //   } else {
  //     return WaveService.getSession(token, callback, { detailsOnly: true });
  //   }
  // },
  // getPublicSessions(callback) {
  //   WaveService.sendRequest("GET", "api/sessions/public", response => {
  //     callback(JSON.parse(response));
  //   });
  // },
  // getTestResults(token, callback) {
  //   if (typeof token !== "string") {
  //     callback = token;
  //     token = WaveService.defaultToken;
  //   }
  //   WaveService.sendRequest("GET", `api/results/${token}`, response => {
  //     callback(JSON.parse(response));
  //   });
  // },
  // getFilteredTestResults: (tokens, refTokens, callback) => {
  //   WaveService.sendRequest(
  //     "GET",
  //     `api/results/${tokens.join(",")}/compare?reftokens=${refTokens.join(
  //       ","
  //     )}`,
  //     response => {
  //       callback(JSON.parse(response));
  //     }
  //   );
  // },
  // pauseSession(token, callback) {
  //   if (typeof token !== "string") {
  //     callback = token;
  //     token = WaveService.defaultToken;
  //   }
  //   WaveService.sendRequest("GET", `api/sessions/${token}/pause`, callback);
  // },
  // resumeSession(token, callback) {
  //   if (typeof token !== "string") {
  //     callback = token;
  //     token = WaveService.defaultToken;
  //   }
  //   WaveService.sendRequest("GET", `api/sessions/${token}/resume`, callback);
  // },
  // stopSession(token, callback) {
  //   if (typeof token !== "string") {
  //     callback = token;
  //     token = WaveService.defaultToken;
  //   }
  //   WaveService.sendRequest("GET", `api/sessions/${token}/stop`, callback);
  // },
  // deleteSession(token, callback) {
  //   if (typeof token !== "string") {
  //     callback = token;
  //     token = WaveService.defaultToken;
  //   }
  //   WaveService.sendRequest("GET", `api/sessions/${token}/delete`, callback);
  // },
  // findToken(fragment, callback) {
  //   WaveService.sendRequest(
  //     "GET",
  //     `api/sessions/${fragment}/token`,
  //     response => {
  //       response = JSON.parse(response);
  //       if (response.token) {
  //         callback(response.token);
  //       } else {
  //         callback(null);
  //       }
  //     }
  //   );
  // },
  // downloadJson(token, api) {
  //   if (!api) {
  //     api = token;
  //     token = WaveService.defaultToken;
  //   }
  //   location.href = `api/results/${token}/${api}/json`;
  // },
  // downloadJsons(token, apis) {
  //   if (typeof token !== "string") {
  //     apis = token;
  //     token = WaveService.defaultToken;
  //   }
  //   const shortToken = token.split("-").shift();
  //   let zipFileName = shortToken + ".zip";
  //   const createZip = jsons => {
  //     const zip = new JSZip();
  //     Object.keys(jsons).forEach(api =>
  //       zip.file(jsons[api].fileName, jsons[api].value)
  //     );
  //     return zip;
  //   };
  //   const jsons = {};
  //   apis.forEach(api => {
  //     WaveService.sendRequest(
  //       "GET",
  //       `api/results/${token}/${api}/json`,
  //       (response, headers) => {
  //         let fileName = "";
  //         try {
  //           fileName = headers["content-disposition"]
  //             .split(";")
  //             .find(value => value.startsWith("filename"))
  //             .split("=")[1]
  //             .replace(/"/g, "");
  //           zipFileName = fileName
  //             .split("-")
  //             .filter((part, index) => index !== 1)
  //             .join("-")
  //             .replace(/json$/, "zip");
  //         } catch (ignored) {
  //           fileName = shortToken + "-" + api + ".json";
  //         }
  //         jsons[api] = { value: response, fileName };
  //         if (Object.keys(jsons).length === apis.length) {
  //           const zip = createZip(jsons);
  //           zip
  //             .generateAsync({ type: "blob" })
  //             .then(blob => utils.saveBlobAsFile(blob, zipFileName));
  //         }
  //       }
  //     );
  //   });
  // },
  // downloadHtmlZip(token) {
  //   if (typeof token !== "string") token = WaveService.defaultToken;
  //   location.href = `api/results/${token}/html`;
  // },

  // openHtmlReport(token, api, reftoken) {
  //   if (!api) {
  //     api = token;
  //     token = WaveService.defaultToken;
  //   }
  //   if (token instanceof Array) {
  //     const reportUrl = `api/results/${token.join(",")}/${api}/html${
  //       reftoken ? `?reftoken=${reftoken}` : ""
  //     }`;
  //     window.open(reportUrl, "_blank");
  //   } else {
  //     const reportUrl = `api/results/${token}/${api}/html`;
  //     window.open(reportUrl, "_blank");
  //   }
  // },
  // openSession(token) {
  //   if (!token) return;
  //   const sessionUrl = `/results.html?token=${token}`;
  //   window.open(sessionUrl, "_blank");
  // },
};
