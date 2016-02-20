var sentencifyApp = angular.module('sentencifyApp', [
  'ngRoute',
  'ngMessages',
  'sentencifyControllers'
]);
sentencifyApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/home', {
        templateUrl: 'partials/home.html',
        controller: 'HomeController'
      }).
      when('/game/:sentenceId', {
        templateUrl: 'partials/game.html',
        controller: 'GameController'
      }).
      otherwise({
        redirectTo: '/home'
      });
  }]);