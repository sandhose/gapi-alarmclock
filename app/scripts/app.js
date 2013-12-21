"use strict";

angular.module("alarmClockApp", [
  "ngCookies",
  "ngResource",
  "ngSanitize",
  "ngRoute"
])
  .config(function ($routeProvider) {
    $routeProvider
      .when("/", {
        templateUrl: "views/main.html",
        controller: "MainCtrl"
      })
      .when("/settings", {
        templateUrl: "views/settings.html",
        controller: "SettingsCtrl"
      })
      .when("/settings/:whatever", {
        templateUrl: "views/settings.html",
        controller: "SettingsCtrl"
      })
      .otherwise({
        redirectTo: "/"
      });
  });
