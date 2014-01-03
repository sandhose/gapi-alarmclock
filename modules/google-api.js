"use strict";
var url = require("url");

var GoogleAPI = function GoogleAPI(theApp, name) {
  this.app = theApp;
  this.logger = this.app.getLogger();
  this.name = name;
};

GoogleAPI.prototype = {
  // @TODO move config to file
  OAuth2Config: {
    clientId: "789571319516-ch3j8s80nt0gmddnmeg5p6dijc50120k.apps.googleusercontent.com",
    clientSecret: "bfc3X3xKlikW-W5Ja2CgF7VZ",
    redirectUrl: "http://localhost:9000/api/google/oauth2callback"
  },

  setup: function setup() {
    this.app.on("ready", this.load.bind(this));
    this.gapi = require("googleapis");
    this.OAuth2Credentials = {
      "refresh_token": null,
      "access_token": null
    };
  },

  load: function() {
    var self = this;
    this.storage = this.app.getStorage(this);
    this.OAuth2Credentials.refresh_token = this.storage.get("refresh_token");

    this.apiEngine = this.app.getModule("rest-api");
    this.apiEngine.registerAPI("google", {
      "oauth-url": function(req, res, callback) {
        callback({
          url: self.generateAuthURL()
        });
      },
      "oauth2callback": function(req, res, callback) {
        var query = url.parse(req.url, true).query;
        self.OAuthCallback(query.code, function(err) {
          if(!err) {
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.write("Redirecting to app...");
            res.end();
            callback("done");
          }
          else {
            callback(err, 500);
          }
        });
      }
    });

    if(this.OAuth2Credentials.refresh_token) {
      this.getOAuth2Client().refreshAccessToken(function(err, credentials) {
        if(!err) {
          self.OAuth2Credentials.access_token = credentials.access_token;
          self.synchronize();
        }
        else {
          self.logger.error(err);
        }
      });
    }

  },

  _refreshOAuth2Client: function() {
    if(this.OAuth2Client === undefined) {
      this.OAuth2Client = new this.gapi.OAuth2Client(this.OAuth2Config.clientId, this.OAuth2Config.clientSecret, this.OAuth2Config.redirectUrl);
    }

    if(this.OAuth2Credentials) {
      this.OAuth2Client.credentials = this.OAuth2Credentials;
    }
    return this;
  },

  getOAuth2Client: function() {
    this._refreshOAuth2Client();
    return this.OAuth2Client;
  },

  synchronize: function() {
    // @TODO sync with api
  },

  generateAuthURL: function() {
    return this.getOAuth2Client().generateAuthUrl({
      "access_type": "offline",
      scope: "https://www.googleapis.com/auth/calendar"
    });
  },

  OAuthCallback: function(code, callback) {
    var self = this;
    this.getOAuth2Client().getToken(code, function(err, token) {
      if(err) {
        self.logger.error(err);
        if(typeof callback === "function") {
          callback(err);
          return;
        }
      }

      if(token.refresh_token) {
        self.OAuth2Credentials.refresh_token = token.refresh_token;
        self.storage.set("refresh_token", token.refresh_token);
      }

      if(token.access_token) {
        self.OAuth2Credentials.access_token = token.access_token;
      }

      self._refreshOAuth2Client();

      if(!self.OAuth2Credentials.refresh_token) {
        self.revokeAccessToken();
        err = {
          message: "had to revoke token... please re-enable the access to the Googla APIs",
          url: self.generateAuthURL()
        };
      }

      if(typeof callback === "function") {
        callback(err);
      }
    });
    return this;
  },

  revokeAccessToken: function() {
    this.getOAuth2Client().revokeToken(this.OAuth2Credentials.access_token);
    return this;
  }
};

module.exports = function(theApp, name) {
  return new GoogleAPI(theApp, name);
};