var sentencifyApp = angular.module('sentencifyApp', [
  'ngRoute',
  'sentencifyControllers'
]);
sentencifyApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/partials/home.html',
        controller: 'HomeController'
      }).
      when('/home', {
        templateUrl: '/partials/home.html',
        controller: 'HomeController'
      }).
      when('/game/:sentenceId', {
        templateUrl: '/partials/game.html',
        controller: 'GameController'
    });
    $locationProvider.html5Mode(true);

  }]);