"use strict";
var logger,
    url = require("url"); // it will be winston logger after setup

var RestApi = function RestApi(theApp, name) {
  this.app = theApp;
  logger = this.app.getLogger();
  this.name = name;
};

RestApi.prototype = {
  // Setup
  setup: function setup() {
    this.app.on("ready", this.registerHandler.bind(this));
    this.api = {};
  },

  // Register handler to webserver
  registerHandler: function registerHandler() {
    this.server = this.app.getModule("webserver");
    if(this.server) {
      this.server.registerHandler("/api", this.handleRequest.bind(this));
    }
  },

  // Handle request
  handleRequest: function handleRequest(req, res, cb) {
    var requestPath = url.parse(req.url).pathname,
        apiPath = this._trimSlashes(requestPath).split("/"),
        responseObj = {
      location: apiPath
    };

    res.writeHead(200, {"Content-Type": "text/json"});
    res.write(JSON.stringify(responseObj));
    res.end();
    logger.info("request api", req.method, apiPath.join("/"));
    cb();
  },

  // Register API
  registerAPI: function registerAPI(path, api) {
    if(typeof path === "string") {
      path = this._trimSlashes(path).split("/");
    }
    console.log(path, api);
  },

  _trimSlashes: function _trimSlashes(input) {
    if(input.charAt(0) === "/") {
      input = input.substr(1);
    }
    if(input.charAt(input.length - 1) === "/") {
      input = input.substr(0, input.length - 1);
    }

    return input;
  }
};

module.exports = function(theApp, name) {
  return new RestApi(theApp, name);
};