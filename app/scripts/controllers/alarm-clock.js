"use strict";

angular.module("alarmClockApp")
  .controller("AlarmClockCtrl", function ($scope, $http) {
    $scope.formatTime = function(time, hideAM) {
      if(!time) {
        return "...";
      }
      var date = new Date(time);
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? "0"+minutes : minutes;
      var strTime = hours + ":" + minutes + (hideAM ? "" : ampm);
      return strTime;
    };
    $scope.nextEvent = {};
    var loadNext = function() {
      $http({ method: "GET", url: "/api/google/calendar/events/next"})
        .success(function(data) {
          $scope.nextEvent = data;
        })
        .error(function() {
          setTimeout(loadNext, 5000);
        });
    };

    loadNext();

    $scope.wake = {};
    var loadWake = function() {
      $http({ method: "GET", url: "/api/wake"})
        .success(function(data) {
          $scope.wake = data;
        })
        .error(function() {
          setTimeout(loadWake, 2000);
        });
    };

    loadWake();
  });
