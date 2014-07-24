/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var GaiaApps = {

  normalizeName: function(name) {
    return name.replace(/[- ]+/g, '').toLowerCase();
  },

  getInstalledApps: function() {
    let req = navigator.mozApps.mgmt.getAll();
    req.onsuccess = function() {
      marionetteScriptFinished(req.result);
    }
  },

  getRunningApps: function() {
    let manager = window.wrappedJSObject.AppWindowManager || window.wrappedJSObject.WindowManager;
    let runningApps = manager.getRunningApps();
    // Return a simplified version of the runningApps object which can be
    // JSON-serialized.
    let apps = {};
    for (let app in runningApps) {
        let anApp = {};
        for (let key in runningApps[app]) {
            if (['name', 'origin', 'manifest'].indexOf(key) > -1) {
                anApp[key] = runningApps[app][key];
            }
        }
        apps[app] = anApp;
    }
    return apps;
  },

  getRunningAppOrigin: function(name) {
    let manager = window.wrappedJSObject.AppWindowManager || window.wrappedJSObject.WindowManager;
    let runningApps = manager.getRunningApps();
    let origin;

    for (let property in runningApps) {
      if (runningApps[property].name == name) {
        origin = property;
      }
    }

    return origin;
  },

  getPermission: function(appName, permissionName) {
    GaiaApps.locateWithName(appName, function(app) {
      console.log("Getting permission '" + permissionName + "' for " + appName);
      let mozPerms = navigator.mozPermissionSettings;
      let result = mozPerms.get(
        permissionName, app.manifestURL, app.origin, false
      );
      marionetteScriptFinished(result);
    });
  },

  setPermission: function(appName, permissionName, value) {
    GaiaApps.locateWithName(appName, function(app) {
      console.log("Setting permission '" + permissionName + "' for " +
        appName + "to '" + value + "'");
      let mozPerms = navigator.mozPermissionSettings;
      mozPerms.set(
        permissionName, value, app.manifestURL, app.origin, false
      );
      marionetteScriptFinished();
    });
  },

  sendLocateResponse: function(aCallback, app, appName, entryPoint) {
    let callback = aCallback || marionetteScriptFinished;
    if (callback === marionetteScriptFinished) {
      let result = false;
      if (typeof(app) === 'object') {
        result = {
          name: app.manifest.name,
          origin: app.origin,
          entryPoint: entryPoint || null,
          normalizedName: appName
        };
      }
      callback(result);
    } else {
      callback(app, appName, entryPoint);
    }
  },

  locateWithName: function(name, aCallback) {
    let callback = aCallback || marionetteScriptFinished;
    let apps = window.wrappedJSObject.Applications.installedApps;
    let normalizedSearchName = GaiaApps.normalizeName(name);

    for (let manifestURL in apps) {
      let app = apps[manifestURL];
      let origin = null;
      let entryPoints = app.manifest.entry_points;
      if (entryPoints) {
        for (let ep in entryPoints) {
          let currentEntryPoint = entryPoints[ep];
          let appName = currentEntryPoint.name;

          if (normalizedSearchName === GaiaApps.normalizeName(appName)) {
            return GaiaApps.sendLocateResponse(callback, app, appName, ep);
          }
        }
      } else {
        let appName = app.manifest.name;

        if (normalizedSearchName === GaiaApps.normalizeName(appName)) {
          return GaiaApps.sendLocateResponse(callback, app, appName);
        }
      }
    }
    callback(false);
  },

  locateWithManifestURL: function(manifestURL, entryPoint, aCallback) {
    let callback = aCallback || marionetteScriptFinished;
    let app = window.wrappedJSObject.Applications.getByManifestURL(manifestURL);
    let appName;

    if (entryPoint) {
      if (app.manifest.entry_points[entryPoint]) {
        appName = app.manifest.entry_points[entryPoint].name;
      } else {
        app = null;
      }
    } else {
      appName = app.manifest.name;
    }

    GaiaApps.sendLocateResponse(callback, app, appName, entryPoint);
  },

  // Returns the number of running apps.
  numRunningApps: function() {
    let count = 0;
    let manager = window.wrappedJSObject.AppWindowManager || window.wrappedJSObject.WindowManager;
    let runningApps = manager.getRunningApps();
    for (let origin in runningApps) {
      count++;
    }
    return count;
  },

  // Kills the specified app.
  kill: function(aOrigin, aCallback) {
    let callback = aCallback || marionetteScriptFinished;
    let manager = window.wrappedJSObject.AppWindowManager || window.wrappedJSObject.WindowManager;
    let runningApps = manager.getRunningApps();
    if (!runningApps.hasOwnProperty(aOrigin)) {
      callback(false);
    }
    else {
      window.addEventListener('appterminated', function gt_onAppTerminated() {
        window.removeEventListener('appterminated', gt_onAppTerminated);
        waitFor(
          function() {
            console.log("app with origin '" + aOrigin + "' has terminated");
            callback(true);
          },
          function() {
            let runningApps = manager.getRunningApps();
            return !runningApps.hasOwnProperty(aOrigin);
          }
        );
      });
      console.log("terminating app with origin '" + aOrigin + "'");
      manager.kill(aOrigin);
    }
  },

  // Kills all running apps, except the homescreen.
  killAll: function() {
    let originsToClose = [];
    let that = this;

    let manager = window.wrappedJSObject.AppWindowManager || window.wrappedJSObject.WindowManager;
    let runningApps = manager.getRunningApps();
    for (let origin in runningApps) {
      if (origin.indexOf('homescreen') == -1) {
        originsToClose.push(origin);
      }
    }

    if (!originsToClose.length) {
      marionetteScriptFinished(true);
      return;
    }

    originsToClose.slice(0).forEach(function(origin) {
      GaiaApps.kill(origin, function() {});
    });

    // Even after the 'appterminated' event has been fired for an app,
    // it can still exist in the apps list, so wait until 1 or fewer
    // apps are running (since we don't close the homescreen app).
    waitFor(
      function() { marionetteScriptFinished(true); },
      function() { return that.numRunningApps() <= 1; }
    );
  },

  launch: function(app, appName, entryPoint) {
    if (app) {
      let manager = window.wrappedJSObject.AppWindowManager || window.wrappedJSObject.WindowManager;
      let runningApps = manager.getRunningApps();
      let origin = app.origin;

      let sendResponse = function() {
        let app = runningApps[origin];
        let result = {
          frame: (app.browser) ? app.browser.element : app.frame.firstChild,
          src: (app.browser) ? app.browser.element.src : app.iframe.src,
          name: app.name,
          origin: origin};
        marionetteScriptFinished(result);
      };

      if (manager.getDisplayedApp() == origin) {
        console.log("app with origin '" + origin + "' is already running");
        sendResponse();
      } else {
        window.addEventListener('appopen', function appOpen() {
          window.removeEventListener('appopen', appOpen);
          waitFor(
            function() {
              console.log("app with origin '" + origin + "' has launched");
              sendResponse();
            },
            function() {
              return manager.getDisplayedApp() == origin;
            }
          );
        });
        console.log("launching app with name '" + appName + "'");
        app.launch(entryPoint || null);
      }
    } else {
      marionetteScriptFinished(false);
    }
  },

  // Launches app with the specified name (e.g., 'Calculator'); returns the
  // an object with the app frame if successful, false if the app can't be
  // found, or times out if the app frame can't be found after launching the
  // app.
  launchWithName: function(name) {
    GaiaApps.locateWithName(name, this.launch);
  },

  // Launches app with the specified manifestURL. returns the
  // an object with the app frame if successful, false if the app can't be
  // found, or times out if the app frame can't be found after launching the
  // app.
  //
  // This is prefered over launchWithName because localized builds have
  // different names
  launchWithManifestURL: function(manifestURL, entryPoint) {
    GaiaApps.locateWithManifestURL(manifestURL, entryPoint, this.launch);
  },

  close: function(app, appName, entryPoint) {
    if (app) {
      let origin = GaiaApps.getRunningAppOrigin(appName);
      GaiaApps.kill(origin);
    } else {
      marionetteScriptFinished(false);
    }
  },

  // Closes app with the specified name (e.g., 'Calculator'); returns nothing
  closeWithName: function(name) {
    GaiaApps.locateWithName(name, this.close);
  },

  closeWithManifestURL: function(manifestURL, entryPoint) {
    GaiaApps.locateWithManifestURL(manifestURL, entryPoint, this.close);
  },

  /**
   * Returns the currently displayed app.
   */
  displayedApp: function() {
    let manager = window.wrappedJSObject.AppWindowManager || window.wrappedJSObject.WindowManager;
    let runningApps = manager.getRunningApps();
    let origin = manager.getDisplayedApp();
    console.log("app with origin '" + origin + "' is displayed");
    let app = runningApps[origin];
    let result = {
      frame: (app.browser) ? app.browser.element : app.frame.firstChild,
      src: (app.browser) ? app.browser.element.src : app.iframe.src,
      name: app.name,
      origin: origin};
    marionetteScriptFinished(result);
  },

  /**
   * Uninstalls the app with the specified name.
   */
  uninstallWithName: function(name) {
    GaiaApps.locateWithName(name, function uninstall(app) {
      navigator.mozApps.mgmt.uninstall(app);
      marionetteScriptFinished(false);
    });
  }
};
