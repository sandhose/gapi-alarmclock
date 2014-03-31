"use strict";

var Speaker = require("speaker");
var lame = require("lame");
var path = require("path");
var fs = require("fs");

var MusicPlayer = function(theApp, name) {
  this.app = theApp;
  this.logger = this.app.getLogger();
  this.name = name;
};

MusicPlayer.prototype = {
  options: {
    fileDir: path.join(__dirname, "..", "/audio"),
    wakeSound: "wake.mp3"
  },

  setup: function setup() {
    this.app.on("wake up", this.play.bind(this));
    //this.app.on("ready", this.test.bind(this)); // for testing
    this.app.on("exit", this.stop.bind(this));
    this.speaker = new Speaker();
    this.decoder = new lame.Decoder();
    this.playing = false;
  },

  _getFilePath: function() {
    return path.join(this.options.fileDir, this.options.wakeSound);
  },

  play: function wake() {
    this.speakerStream = fs.createReadStream(this._getFilePath())
      .pipe(this.decoder)
      .pipe(this.speaker);

    this.speakerStream.on("end", this._unplay.bind(this));
    this.speakerStream.on("finish", this._unplay.bind(this));

    this.playing = true;
  },

  pause: function pause() {
    //this.speakerStream.pause();
    this.logger.warn("MusicPlayer#pause() not implemented");
  },

  _unplay: function() {
    this.playing = false;
  },

  resume: function resume() {
    //this.speakerStream.resume();
    this.logger.warn("MusicPlayer#resume() not implemented");
  },

  stop: function stop() {
    if(this.playing) {
      this.speakerStream.end();
    }
  },

  test: function test() {
    this.play();
    setTimeout(this.stop.bind(this), 5000);
  }
};

module.exports = function(theApp, name) {
  return new MusicPlayer(theApp, name);
};
