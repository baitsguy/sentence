var phonecatControllers = angular.module('sentencifyControllers', []);

phonecatControllers.controller('HomeController', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    socket.emit('getSentences');
    $scope.helloworld = "lala";
    socket.on('sentences', function(sentences) {
      $scope.$apply(function() {
        $scope.sentenceTextList = sentences;
    });
    });
}]);