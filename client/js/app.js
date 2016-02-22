var sentencifyApp = angular.module('sentencifyApp', [
  'ngRoute',
  'sentencifyControllers'
]);
sentencifyApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/partials/about.html',
        controller: 'AboutController'
      }).
      when('/sentences', {
        templateUrl: '/partials/sentences.html',
        controller: 'HomeController'
      }).
      when('/game/:sentenceId', {
        templateUrl: '/partials/game.html',
        controller: 'GameController'
    });
    $locationProvider.html5Mode(true);

  }]);