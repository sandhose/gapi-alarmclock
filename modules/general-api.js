"use strict";

var logger = console, // it will be winston logger after setup
    os = require("os");

var GeneralAPI = function GeneralAPI(theApp, name) {
  this.app = theApp;
  logger = this.app.getLogger();
  this.name = name;
};

GeneralAPI.prototype = {
  setup: function setup() {
    this.app.on("ready", this.initAPIs.bind(this));
    this.packageJson = require("../package.json");
  },

  initAPIs: function initAPIs() {
    var self = this;
    this.apiEngine = this.app.getModule("rest-api");
    this.apiEngine.registerAPI("system", {
      GET: function(req, res, callback) {
        callback({
          os: {
            hostname: os.hostname(),
            type: os.type(),
            kernel: os.release(),
            uptime: os.uptime()
          },
          process: {
            cwd: process.cwd(),
            version: process.version
          },
          package: {
            name: self.packageJson.name,
            version: self.packageJson.version,
            author: self.packageJson.author
          }
        });
      },
      exit: function(req, res, callback) {
        callback({
          message: "app will close"
        });
        self.app.exit();
      }
    });
  }
};

module.exports = function(theApp, name) {
  return new GeneralAPI(theApp, name);
};