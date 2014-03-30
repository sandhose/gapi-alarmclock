"use strict";

angular.module("alarmClockApp")
  .controller("MainCtrl", function($scope, $http, $location) {
    $http.get("/api/google/status").success(function(data) {
      $scope.status = data;
      if(!data.logged || !data.calendar) {
        $location.path("/setup");
      }
    });
  });
