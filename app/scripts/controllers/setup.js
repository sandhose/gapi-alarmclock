"use strict";

angular.module("alarmClockApp")
  .controller("SetupCtrl", function ($scope, $http, $q) {
    var load = function() {
      $http.get("/api/google/status").success(function(data) {
        $scope.status = data;
        $scope.status.both = data.logged && data.calendar;
        $scope.calendar = {};

        if(data.logged) {
          var calenderRequest = $http.get("/api/google/calendar/list");
          var userRequest = $http.get("/api/google/user");
          $q.all([calenderRequest, userRequest]).then(function(results) {
            $scope.calendarList = results[0].data;
            $scope.user = results[1].data;
          });
        }
      });
    };

    $http.get("/api/google/oauth-url").success(function(data) {
      $scope.url = data.url;
    });

    $scope.login = function() {
      var popup = window.open($scope.url, "google-auth", "height=600,width=450");
      if(window.focus) { popup.focus(); }
      window.doneLogin = function() {
        popup.close();
        load();
      };
      window.thePopup = popup;
    };

    load();

    $scope.$watch("calendar", function(value) {
      if(value && value.id) {
        $http({
          method: "POST",
          url: "/api/google/calendar",
          data: "id=" +value.id,
          headers: {"Content-Type": "application/x-www-form-urlencoded"}
        }).success(function() {
          load();
        });
      }
    });
  });
