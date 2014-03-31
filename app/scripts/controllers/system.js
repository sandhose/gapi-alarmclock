"use strict";

angular.module("alarmClockApp")
  .controller("SystemCtrl", function($scope, $http) {
    $scope.system = {};
    $http({ method: "GET", url: "/api/system"})
      .success(function(data) {
        $scope.system = data;
      });
  });
