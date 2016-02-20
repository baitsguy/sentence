var phonecatControllers = angular.module('sentencifyControllers', ['ngMessages']);

phonecatControllers.controller('HomeController', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    $scope.sentences = ["Waiting"];
    socket.emit('getGame');
    socket.on('sentence', function(sentence) {
      $scope.sentences = ["hello", sentence.text];
    });
}]);