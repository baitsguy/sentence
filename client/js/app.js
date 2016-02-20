var sentencifyApp = angular.module('sentencifyApp', [
  'ngRoute',
  'sentencifyControllers'
]);
sentencifyApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'partials/home.html',
        controller: 'HomeController'
      }).
      when('/home', {
        templateUrl: 'partials/home.html',
        controller: 'HomeController'
      }).
      when('/game/:sentenceId', {
        templateUrl: 'partials/game.html',
        controller: 'GameController'
      });
  }]);