"use strict";

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    jshint: {
      all: ["Gruntfile.js", "app.js", "modules/*.js"],
      options: {
        jshintrc: ".jshintrc",
        reporter: require("jshint-stylish")
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");

  grunt.registerTask("run", function() {
    grunt.task.run(["jshint", "app"]);
  });

  grunt.registerTask("app", function() {
    require("./app").on("appEnd", this.async());
  });
};