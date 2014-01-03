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
        apiPath = this._trimSlashes(requestPath).split("/");

    var sendResponse = function(responseObj, statusCode) {
      if(responseObj !== "done") {
        statusCode = statusCode || 200;
        res.writeHead(statusCode, {"Content-Type": "text/json"});
        res.write(JSON.stringify(responseObj));
        res.end();
      }
      
      cb();
    };

    if(apiPath.shift() !== "api") {
      sendResponse({
        "message": "internal error"
      }, 500);
      return;
    }
    
    var apiObj = this.getAPI(apiPath);
    if(typeof apiObj === "function") {
      apiObj(req, res, sendResponse);
    }
    else if(typeof apiObj === "object") {
      if(typeof apiObj[req.method] === "function") {
        apiObj[req.method](req, res, sendResponse);
      }
      else {
        sendResponse({
          message: "method " + req.method + " not allowed for " + requestPath
        }, 405);
      }
    }
    else {
      sendResponse({
        message: "api does not exist"
      }, 404);
    }
  },

  // Register API
  registerAPI: function registerAPI(path, api) {
    if(typeof path === "string") {
      path = this._trimSlashes(path).split("/");
    }
    
    var rootAPI = path.shift();
    var parent = {};
    if(typeof this.api[rootAPI] === "object") {
      parent = this.api[rootAPI];
    }

    this.api[rootAPI] = this.buildAPI(parent, path, api);
    return this;
  },

  buildAPI: function buildAPI(parent, path, api) {
    var toExtend = {};
    if(path.length === 0) {
      toExtend = api;
    }
    else {
      var apiName = path.shift();
      var parentAPI = parent[apiName] || {};
      toExtend[apiName] = this.buildAPI(parentAPI, path, api);
    }
    return _.extend(parent, toExtend);
  },

  // Get API for path (Array)
  getAPI: function getAPI(path, parent) {
    parent = parent || this.api;

    if(typeof path === "string") {
      path = this._trimSlashes(path).split("/");
    }

    if(path.length === 0) {
      return parent;
    }
    else {
      var subAPI = path.shift();
      if(parent[subAPI] === undefined) {
        return false; // TODO: And if API got parameters ?
      }
      return this.getAPI(path, parent[subAPI]);
    }
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