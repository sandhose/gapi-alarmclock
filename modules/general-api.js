"use strict";

var logger = console, // it will be winston logger after setup
    os = require("os"),
    spawn = require("child_process").spawn;

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
        var wifiProcess = spawn("sh", ["-c", "iw wlan0 link | grep \"SSID\""]);
        var connectStatus = "";
        wifiProcess.stdout.on("data", function(data) {
          connectStatus += data;
        });

        wifiProcess.on("close", function() {
          if(!connectStatus) {
            connectStatus = "Ethernet";
          }
          else {
            connectStatus = connectStatus.substring(connectStatus.indexOf("SSID: ") + 6).replace("\n", "");
          }

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
            },
            connection: connectStatus
          });
        });
      },
      exit: function(req, res, callback) {
        callback({
          message: "app will close"
        });
        self.app.exit();
      }
    });

    this.apiEngine.registerAPI("wake", {
      GET: function(req, res, callback) {
        callback({ date: self.app.wakeDate });
      }
    });
  }
};

module.exports = function(theApp, name) {
  return new GeneralAPI(theApp, name);
};
