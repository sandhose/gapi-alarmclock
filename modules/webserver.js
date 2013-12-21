"use strict";

var http = require("http"),
    fs = require("fs"),
    path = require("path"),
    url = require("url");

var extType = {
  html: "text/html",
  js: "application/javascript",
  css: "text/css",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  ico: "image/x-icon"
};

var logger = console; // it will be winston logger after setup

var WebServer = function WebServer(theApp, name) {
  this.app = theApp;
  logger = this.app.getLogger();
  this.name = name;
};

WebServer.prototype = {
  // Server default options
  _defaults: {
    port: 1337,
    publicDir: "/web",
    type: "static",
    indexName: "index.html"
  },

  // Setup the web server
  setup: function setup(options) {
    if(!_) {
      throw new Error("underscore is not loaded or accessible!");
    }

    this.options = _.extend(this._defaults, options);
    this.app.on("ready", this.startServer.bind(this));
    this.app.on("exit", this.exit.bind(this));

    this.server = http.createServer(this.handleRequest.bind(this));
    //this.server.on("request", this.handleRequest.bind(this));
    this.server.addListener("connection",function(stream) {
      stream.setTimeout(4000);
    });

    this.publicPath = path.join(process.cwd(), this.options.publicDir);

    this.handlers = [];
  },

  // Start the server
  startServer: function startServer() {
    this.server.listen(this.options.port);
    logger.info("server listening on port", this.options.port);
  },

  // Register a request handler (RESTful, ...)
  registerHandler: function registerHandler(prefix, handler) {
    this.handlers[prefix] = handler;
    logger.info("request handler registered", prefix);
  },

  // Handle an incomming request
  handleRequest: function handleRequest(req, res) {
    var startTime = process.hrtime();
    var cb = function() {
      this.logRequest(req, res, startTime);
    }.bind(this);

    for(var i in this.handlers) {
      if(url.parse(req.url).pathname.indexOf(i) === 0) {
        this.handlers[i](req, res, cb);
        return;
      }
    }

    this.handleStatic(req, res, cb);
  },
  handleStatic: function handleStatic(req, res, cb) {
    var self = this;
    var filePath = path.join(this.publicPath, url.parse(req.url).pathname);
    if(filePath.indexOf(this.publicPath) !== 0) {
      res.writeHead(500, {"Content-Type": "text/plain"});
      res.write("Oh, really ? :<");
      res.end();
      if(typeof cb === "function") {
        cb();
      }

      return;
    }

    fs.stat(filePath, function(err, stats) {
      if(err) {
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.write("I think this file does not exist...");
        res.end();
        if(typeof cb === "function") {
          cb();
        }

        return;
      }

      if(stats.isDirectory()) {
        filePath = path.join(filePath, self.options.indexName);
      }

      fs.readFile(filePath, function(err, content) {
        if(err) {
          res.writeHead(404, {"Content-Type": "text/plain"});
          res.write("I think this file does not exist...");
          res.end();
          if(typeof cb === "function") {
            cb();
          }
          return;
        }

        var fileExt = path.extname(filePath).substring(1);
        var contentType = extType[fileExt] || "text/plain";

        res.writeHead(200, {"Content-Type": contentType});
        res.write(content);
        res.end();
        if(typeof cb === "function") {
          cb();
        }
      });
    });
  },

  // Exit
  exit: function exit() {
    logger.info("closing server");
    this.server.close();
  },

  logRequest: function logRequest(req, res, startTime) {
    var diff = process.hrtime(startTime);
    logger.log(
      (res.statusCode === 200 ? "info" : "warn"),
      req.method,
      res.statusCode,
      url.parse(req.url).pathname,
      Math.round((diff[0] + diff[1] / 1e9) * 100000) / 100, "ms"
    );
  }
};


module.exports = function(theApp, name) {
  return new WebServer(theApp, name);
};