var phonecatControllers = angular.module('sentencifyControllers', []);

phonecatControllers.controller('HomeController', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    $scope.title = "Home!"
}]);