"use strict";
var _ = GLOBAL._ = require("underscore"); // Underscore.js
var events = require("events");
var winston = require("winston");

var App = function(options) {
  if(typeof options === "string") {
    options = require(options);
  }

  this.options = _.extend(this._defaults, options);
  this.setup();
};

App.prototype = {
  // Default options
  _defaults: {
    modules: {
      debug: false, // maybe not
      webserver: {
        port: 9000,
        publicDir: "/public",
        type: "static"
      },
      "rest-api": true,
      "nconf-storage": true,
      "general-api": true,
      "google-api": true,
      "music-player": true
    }
  },

  // Setup
  setup: function setup() {
    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({
          colorize: true
        }),
      ]
    });
    this.logger.info("initializing the app");
    this.logger.profile("runtime");

    this.modules = [];
    events.EventEmitter.call(this);
    _.each(this.options.modules, function(options, moduleName) {
        if(options) {
          this.loadModule(moduleName, options);
        }
      }, this);
    this.emit("ready");

    if(!this.storage) { // No storage module!
      this.logger.warn("no storage module registered!");
    }

    process.on("SIGINT", this.exit.bind(this));
    process.on("exit", function() {
      this.logger.info("Goodbye!");
      this.emit("appEnd");
    }.bind(this));

    this.wakeTimeout = null;

    setTimeout(this.requestSync.bind(this), 1000);
  },

  // Get logger for submodules
  getLogger: function getLogger() {
    return this.logger;
  },

  // Get module (from other modules)
  getModule: function getModule(name) {
    if(this.modules[name]) {
      return this.modules[name];
    }
    else {
      this.logger.error("module", name, "is not loaded! :(");
    }
  },

  // Load Modules
  loadModule: function loadModule(name, options) {
    // Throw an error if module is already loaded
    if(this.modules[name]) {
      var e = new Error("module", name, "is already loaded");
      this.logger.error(e);
      return e;
    }

    // Load module and handle any error
    var module;
    try {
      module = require("./modules/" + name)(this, name);
    }
    catch(e) {
      this.logger.error("could not load module", name, e);
      console.log(e);
      return e;
    }

    // Setup function
    if(typeof module.setup === "function") {
      module.setup(options);
    }

    // Save it!
    this.registerModule(module);
  },

  // Get Storage for namespace
  getStorage: function getStorage(namespace) {
    if(typeof namespace === "object") {
      namespace = namespace.name;
    }

    return this.storage.getNamespace(namespace);
  },

  // Register module
  registerModule: function registerModule(module) {
    var moduleName = module.name;
    if(!moduleName) {
      this.logger.error("trying to register a non-valid module");
      return;
    }
    this.modules[moduleName] = module;
    this.emit("module register", moduleName);
    if(typeof module.postSetup === "function") {
      module.postSetup();
    }
    this.logger.info("module loaded:", moduleName);
  },

  // Register Storage Module
  registerStorageModule: function registerStorageModule(name) {
    this.storage = this.getModule(name);
    this.logger.info("using", name, "for data storage");
  },

  // Set wake up
  setWakeUp: function setWakeUp(wakeDate) {
    if(wakeDate instanceof Date) {
      var dateDiff = wakeDate - this.wakeDate;
      if(dateDiff < 10000 && dateDiff > -10000) {
        // Do not change for 10 seconds...
        this.logger.info("wake date not changed");
        return;
      }
      if(wakeDate < new Date()) {
        this.logger.warn("wake date already passed");
        return;
      }
      this.logger.info("next wake up set to " + wakeDate.toString());
      this.wakeDate = wakeDate;
      this.emit("wake date set");
    }
  },

  // Request syncing
  requestSync: function requestSync() {
    var self = this,
        syncPending = 0;
    this.emit("do sync", function done(async) {
      syncPending++;
      var doneAsync = function doneAsync() {
        syncPending--;
        if(syncPending === 0) {
          self.doneSync();
        }
      };
      if(async) {
        return doneAsync;
      }
      else {
        doneAsync();
      }
    });
  },

  doneSync: function doneSync() {
    var syncInterval = 60; // @TODO: to be configurable
    this.logger.log("sync done!");
    this.logger.info("next sync in " + syncInterval + " seconds");
    this.nextSync = setTimeout(this.requestSync.bind(this), syncInterval * 1000);
    if(this.wakeTimeout === null) {
      this.wake();
    }
  },

  cancelNextSync: function cancelNextSync() {
    this.logger.warn("next sync cancelled");
    clearTimeout(this.nextSync);
  },

  wake: function wake() {
    if(this.wakeTimeout) {
      clearTimeout(this.wakeTimeout);
      this.wakeTimeout = null;
    }

    var now = new Date();
    var wakeDate = this.wakeDate;
    if(wakeDate instanceof Date) {
      var diff = wakeDate - now;
      this.logger.info("wake up in " + Math.round(diff / 1000) + " seconds");
      // Wake tollerence -> -10s/+60s
      if(diff <= 10000 && diff >= -60000) {
        this.logger.info("WAKE UP!");
        this.emit("wake up");
      }
      // Check wake up every 30min
      else if(diff > 1300 * 1000) {
        this.wakeTimeout = setTimeout(this.wake.bind(this), 1300 * 1000);
      }
      // Wake up time is near...
      else {
        this.wakeTimeout = setTimeout(this.wake.bind(this), diff);
      }
    }
    else {
      this.logger.warn("wake date not set");
    }
  },

  // Exit the app
  exit: function exit() {
    if(this.storage) {
      this.storage.save();
    }
    clearTimeout(this.wakeTimeout);
    clearTimeout(this.nextSync);
    this.logger.profile("runtime");
    this.emit("exit");
  }
};

App.prototype = _.extend(App.prototype, events.EventEmitter.prototype);

module.exports = function(options) {
  return new App(options);
};

if(require.main === module) {
  module.exports();
}
