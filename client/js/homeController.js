var phonecatControllers = angular.module('sentencifyControllers', []);

phonecatControllers.controller('HomeController', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    io.emit('getSentences');
    $scope.helloworld = "lala";
    io.on('sentences', function(sentences) {
      $scope.$apply(function() {
        $scope.sentenceTextList = sentences;
    });
    });
}]);