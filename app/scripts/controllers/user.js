"use strict";

angular.module("alarmClockApp")
  .controller("UserCtrl", function($scope, $http) {
    $scope.user = { name: "Loading...", location: "Unknown", avatar: "", link: "#", connected: false };
    var loadUser = function() {
      $http({ method: "GET", url: "/api/google/user"})
        .success(function(data) {
          $scope.user = data;
        })
        .error(function() {
          setTimeout(loadUser, 1000);
        });
    };

    loadUser();

    $scope.logout = function() {
      $http({ method: "DELETE", url: "/api/google/user"})
        .success(function() {
          window.location.reload();
        });
    };
  });
