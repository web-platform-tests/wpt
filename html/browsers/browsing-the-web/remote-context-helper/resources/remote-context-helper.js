// Requires:
// - /common/dispatcher/dispatcher.js
// - /common/utils.js
// - /common/get-host-info.sub.js if automagic conversion of origin names to
// URLs is used.

/**
 * This provides a more friendly interface to remote contexts in dispatches.js.
 * The goal is to make it easy to write multi-window/-frame/-worker tests where
 * the logic is entirely in 1 test file and there is no need to check in any
 * other file (although it is often helpful to check in files of JS helper
 * functions that are shared across remote context).
 *
 * So for example, to test that history traversal works, we create a new window,
 * navigate it to a new document, go back and then go forward.
 *
 * @example
 * promise_test(async t => {
 *   const rcHelper = new RemoteContextHelper();
 *   const rc1 = await rcHelper.addWindow();
 *   const rc2 = await rc1.navigateToNew();
 *   assert_equals(await rc2.executeScript(() => { return "here" }), "here",
 * "rc2 is live"); await rc2.executeScript(() => history.back());
 *   assert_equals(await rc1.executeScript(() => { return "here" }), "here",
 * "rc1 is live"); await rc1.executeScript(() => history.forward());
 *   assert_equals(await rc2.executeScript(() => { return "here" }), "here",
 * "rc2 is live");
 * });
 *
 * Note on the correspondance between remote contexts and
 * `RemoteContextWrapper`s. A remote context is entirely determined by its URL.
 * So navigating away from one and then back again will result in a remote
 * context that can be controlled by the same `RemoteContextWrapper` instance
 * before and after navigation. Messages sent to a remote context while it is
 * destroyed or in BFCache will be queued and processed if that that URL is
 * navigated back to.
 *
 * This framework does not keep track of the history of the frame tree and so it
 * is up to the test script to keep track of what remote contexts are currently
 * active and to keep references to the correspoding `RemoteContextWrapper`s.
 */

const RESOURCES_PATH =
    '/html/browsers/browsing-the-web/remote-context-helper/resources';
const WINDOW_EXECUTOR_PATH = `${RESOURCES_PATH}/executor.html`;
const WORKER_EXECUTOR_PATH = `${RESOURCES_PATH}/executor-worker.js`;

/**
 * Turns a string into an origin. If `origin` is null this will return the
 * current document's origin. If `origin` contains not '/', this will attempt to
 * use it as an index in `get_host_info()`. Otherwise returns the input origin.
 * @private
 * @param {string|null} origin The input origin.
 * @return {string|null} The output origin.
 * @throws {InvalidArgumentException} is `origin` cannot be found in
 *     `get_host_info()`.
 */
function finalizeOrigin(origin) {
  if (!origin) {
    return location.origin;
  }
  if (origin.indexOf('/') == -1) {
    const origins = get_host_info();
    if (origin in origins) {
      return origins[origin];
    } else {
      throw new InvalidArgumentException(
          `${origin} is not a key in the get_host_info() object`);
    }
  }
  return origin;
}

/**
 * @private
 * @param {string} url
 * @returns {string} Absolute url using `location` as the base.
 */
function makeAbsolute(url) {
  return new URL(url, location).toString();
}

/**
 * Represents a configuration for a remote context executor.
 */
class RemoteContextConfig {
  /**
   * @param {string} origin A URL or a key in `get_host_info()`. @see finalizeOrigin for how origins are handled.
   * @param {string[]} scripts  A list of script URLs. The current document will
   *     be used as the base for relative URLs.
   * @param {[string, string][]} headers  A list of pairs of name and value. The
   *     executor will be served with these headers set.
   * @param {string} startOn If supplied, the executor will start when this
   *     event occurs, e.g. "pageshow",
   *  (@see window.addEventListener). This only makes sense for window-based executors, not worker-based.
   *
   */
  constructor(
      {origin = null, scripts = [], headers = [], startOn = null} = {}) {
    this.origin = origin;
    this.scripts = scripts;
    this.headers = headers;
    this.startOn = startOn;
  }

  /**
   * If `config` is not already a `RemoteContextConfig`, one is constructed
   * using `config`.
   * @private
   * @param {object} config
   * @returns
   */
  static ensure(config) {
    if (!config) {
      return DEFAULT_CONTEXT_CONFIG;
    }
    return new RemoteContextConfig(config);
  }

  /**
   * Merges `this` with another `RemoteContextConfig` and to give a new
   * `RemoteContextConfig`. `origin` is replaced by the other if present,
   * `headers` and `scripts` are concatenated with `this`'s coming first.
   * @param {RemoteContextConfig} remoteContextConfig
   * @returns {RemoteContextConfig}
   */
  merged(remoteContextConfig) {
    let origin = this.origin;
    if (remoteContextConfig.origin) {
      origin = remoteContextConfig.origin;
    }
    let startOn = this.startOn;
    if (remoteContextConfig.startOn !== null) {
      startOn = remoteContextConfig.startOn;
    }
    const headers = this.headers.concat(remoteContextConfig.headers);
    const scripts = this.scripts.concat(remoteContextConfig.scripts);
    return new RemoteContextConfig(
        {origin: origin, headers: headers, scripts: scripts, startOn: startOn});
  }
}

/**
 * The default `RemoteContextConfig` to use if none is supplied. It has no
 * origin, headers or scripts.
 * @constant {RemoteContextConfig}
 */
const DEFAULT_CONTEXT_CONFIG = new RemoteContextConfig();

/**
 * This class represents a configuration for creating remote contexts. This is
 * the entry-point
 * for creating remote contexts, providing @see addWindow .
 */
class RemoteContextHelper {
  /**
   * @param {RemoteContextConfig} remoteContextConfig The configuration for this
   *     remote context.
   */
  constructor({remoteContextConfig = null} = {}) {
    this.remoteContextConfig = RemoteContextConfig.ensure(remoteContextConfig);
  }

  /**
   * Creates an executor for a remote context (e.g. window, iframe) with this
   * URL.
   * @private
   * @callback executorCreator
   * @param {string} url The URL or the document in the object.
   */

  /**
   * Creates a new remote context and returns a `RemoteContextWrapper` giving
   * access to it.
   * @private
   * @param {executorCreator} executorCreator A function that takes a URL and
   *     returns a context, e.g. a frame or window.
   * @param {RemoteContextConfig|object|null} extraRemoteContextConfig If
   *     supplied, extra configuration for this remote context to be merged with
   *     `this`'s
   *   existing config. If it's not a `RemoteContextConfig`, it will be used to
   * construct a new one.
   * @returns {RemoteContextWrapper}
   */
  async createContext({
    executorCreator: executorCreator,
    extraRemoteContextConfig = null,
    isWorker = false,
  }) {
    const remoteContextConfig = this.remoteContextConfig.merged(
        RemoteContextConfig.ensure(extraRemoteContextConfig));

    const origin = finalizeOrigin(remoteContextConfig.origin);
    const url =
        new URL(isWorker ? WORKER_EXECUTOR_PATH : WINDOW_EXECUTOR_PATH, origin);

    // UUID is needed for executor.
    const uuid = token();
    url.searchParams.append('uuid', uuid);

    if (remoteContextConfig.headers) {
      addHeaders(url, remoteContextConfig.headers);
    }
    for (const script of remoteContextConfig.scripts) {
      url.searchParams.append('script', makeAbsolute(script));
    }

    if (remoteContextConfig.startOn) {
      url.searchParams.append('startOn', remoteContextConfig.startOn);
    }

    await executorCreator(url);
    return new RemoteContextWrapper(new RemoteContext(uuid), uuid, this);
  }

  /**
   * Creates a window with a remote context. @see createContext for
   * @param {string} target Passed to `window.open` as the 2nd argument
   * @param {string} features Passed to `window.open` as the 3rd argument
   * @returns {RemoteContextWrapper}
   */
  async addWindow(
      {target = null, features = null, extraRemoteContextConfig = null} = {}) {
    return this.createContext({
      executorCreator: windowExecutorCreator(target, features),
      extraRemoteContextConfig: extraRemoteContextConfig,
    });
  }
}

/**
 * Attaches header to the URL. See
 * https://web-platform-tests.org/writing-tests/server-pipes.html#headers
 * @param {string} url the URL to which headers should be attached.
 * @param {[[string, string]]} headers a list of pairs of head-name,
 *     header-value.
 */
function addHeaders(url, headers) {
  function escape(s) {
    return s.replace('(', '\\(').replace(')', '\\)');
  }
  const formattedHeaders = headers.map((header) => {
    return `header(${escape(header[0])}, ${escape(header[1])})`;
  });
  url.searchParams.append('pipe', formattedHeaders.join('|'));
}

function windowExecutorCreator(target, features) {
  if (!target) {
    target = '_blank';
  }
  return url => {
    window.open(url, target, features);
  };
}

async function elementExecutorCreator(
    remoteContextObject, elementName, attributes) {
  return url => {
    remoteContextObject.executeScript((url, elementName, attributes) => {
      const el = document.createElement(elementName);
      for (const attribute in attributes) {
        el.setAttribute(attribute, attributes[attribute]);
      }
      el.src = url;
      document.body.appendChild(el);
    }, [url, elementName, attributes]);
  };
}

function workerExecutorCreator() {
  return url => {
    new Worker(url);
  };
}

async function navigateExecutorCreator(remoteContextObject) {
  return url => {
    remoteContextObject.navigate((url) => {
      window.location = url;
    }, [url]);
    return remoteContextObject.object;
  };
}

/**
 * This class represents a remote context running an executor (a
 * window/frame/worker that can receive commands). It is the interface for
 * scripts to control remote contexts.
 *
 * Instances are returned when new remote contexts are created (e.g. `addFrame`
 * or `navigateToNew`).
 */
class RemoteContextWrapper {
  /**
   * This should only be constructed by `RemoteContextHelper`.
   * @private
   */
  constructor(context, uuid, helper) {
    this.context = context;
    this.uuid = uuid;
    this.helper = helper;
  }

  /**
   * Executes a script in the remote context.
   * @param {function} fn The script to execute.
   * @param {any[]} args An array of arguments to pass to the script.
   * @returns {any} The return value of the script (after being serialized and
   *     deserialized).
   */
  async executeScript(fn, args) {
    return this.context.execute_script(fn, args);
  }

  /**
   * Executes a script in the remote context that will perform a navigation. To
   * do this safely, we must suspend the executor and wait for that to complete
   * before executing. This ensures that all outstanding requests are completed
   * and no more can start. It also ensures that the executor will restart if
   * the page goes into BFCache. It does not return a value.
   * @param {function} fn The script to execute.
   * @param {any[]} args An array of arguments to pass to the script.
   */
  navigate(fn, args) {
    this.executeScript((fn2, args) => {
      executeScriptToNavigate(fn2, args);
    }, [fn.toString(), args]);
  }

  /**
   * Adds a string of HTML to the executor's document.
   * @param {string} html
   * @returns
   */
  async addHtml(html) {
    return this.executeScript((htmlSource) => {
      document.body.insertAdjacentHTML('beforebegin', htmlSource);
    }, [html]);
  }

  /**
   * Adds scripts to the executor's document.
   * @param {string[]} urls A list of URLs. URLs are relative to the current
   *     document.
   * @returns
   */
  async addScripts(urls) {
    if (!urls) {
      return [];
    }
    return this.executeScript(urls => {
      return addScripts(urls);
    }, [urls.map(url => makeAbsolute(url))]);
  }

  /**
   * Adds an iframe to the current document.
   * @param {RemoteContextConfig} extraRemoteContextConfig
   * @param {[string, string][]} attributes A list of pairs of strings of
   *     attribute name and value these will be set on the iframe element when
   *     added to the document.
   * @returns {RemoteContextWrapper} The remote context.
   */
  async addIframe({
    extraRemoteContextConfig = DEFAULT_CONTEXT_CONFIG,
    attributes = {},
  } = {}) {
    return this.helper.createContext({
      executorCreator: await elementExecutorCreator(this, 'iframe', attributes),
      extraRemoteContextConfig: extraRemoteContextConfig,
    });
  }

  /**
   * Adds a dedicated worker to the current document.
   * @param {RemoteContextConfig} extraRemoteContextConfig
   * @returns {RemoteContextWrapper} The remote context.
   */
  async addWorker({extraRemoteContextConfig = DEFAULT_CONTEXT_CONFIG} = {}) {
    return this.helper.createContext({
      executorCreator: await workerExecutorCreator(),
      extraRemoteContextConfig: extraRemoteContextConfig,
      isWorker: true,
    });
  }

  /**
   * Navigates the context to a new document running an executor.
   * @param {RemoteContextConfig} extraRemoteContextConfig
   * @returns {RemoteContextWrapper} The remote context.
   */
  async navigateToNew(
      {extraRemoteContextConfig = DEFAULT_CONTEXT_CONFIG} = {}) {
    return this.helper.createContext({
      executorCreator: await navigateExecutorCreator(this),
      extraRemoteContextConfig: extraRemoteContextConfig,
    });
  }
}

//////////////////////////////////////
// Navigation Helpers.
// It is up to the test script to know which remote context will be navigated to
// and which `RemoteContextWrapper` should be used after navigation.

/**
 * Performs a history traversal.
 * @param {RemoteContextWrapper} rcw The remote context to navigate in.
 * @param {integer} n How many steps to traverse. @see history.go
 */
function historyGo(rcw, n) {
  return rcw.navigate((n) => {
    history.go(n);
  }, [n]);
}

/**
 * Performs a history traversal back.
 * @param {RemoteContextWrapper} rcw The remote context to navigate in.
 */
function historyBack(rcw) {
  return rcw.navigate(() => {
    history.back();
  });
}

/**
 * Performs a history traversal back.
 * @param {RemoteContextWrapper} rcw The remote context to navigate in.
 */
function historyForward(rcw) {
  return rcw.navigate(() => {
    history.forward();
  });
}
