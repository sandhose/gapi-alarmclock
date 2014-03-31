"use strict";

var StorageNamespace = function(ns, storage) {
  this.namespace = ns;
  this.storage = storage;
};

StorageNamespace.prototype = {
  get: function(key) {
    if(key.length === 0) {
      return this.getAll();
    }
    else {
      return this.storage.get(this.namespace + ":" + key);
    }
  },
  set: function(key, value) {
    if(key.length === 0) {
      return;
    }
    this.storage.set(this.namespace + ":" + key, value);
    return this;
  },
  getAll: function() {
    return this.storage.get(this.namespace);
  },
  save: function() {
    this.storage.save();
    return this;
  }
};

var Storage = function(theApp, name) {
  this.app = theApp;
  this.logger = theApp.getLogger();
  this.name = name;
  this.nconf = require("nconf");
};

Storage.prototype = {
  _defaults: {
    configFile: "config.json"
  },

  // Setup
  setup: function(options) {
    this.options = _.extend(this._defaults, options);
    if(this.options.configFile) {
      try {
        this.nconf.file(this.options.configFile).load();
        this.logger.info("configuration file loaded");
      }
      catch(ex) {
        this.logger.error(ex.message);
      }
    }
  },

  // Post-setup
  postSetup: function() {
    this.app.registerStorageModule(this.name);
  },

  // Get Value
  get: function(key) {
    return this.nconf.get(key);
  },

  // Set Value
  set: function(key, value) {
    this.nconf.set(key, value);
    return this;
  },

  // Return namespaced storage
  getNamespace: function(namespace) {
    return new StorageNamespace(namespace, this);
  },

  // Save storage
  save: function(cb) {
    this.logger.info("saving");
    cb = cb || function(){};
    this.nconf.save(cb.bind(this));
    return this;
  }
};

module.exports = function(theApp, name) {
  return new Storage(theApp, name);
};
