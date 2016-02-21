var app = angular.module('sentencifyControllers', ['ngRoute']);

app.controller('HomeController', ['$scope', '$routeParams', '$window',
  function($scope, $routeParams, $window) {
    console.log("called home controller");
    socket.emit('getSentences');
    $scope.helloworld = "lala";
    socket.on('sentences', function(sentences) {
      $scope.$apply(function() {
        $scope.sentenceTextList = sentences;
      });
    });

    $scope.createGame = function() {
      socket.emit('create game');
    };
}]);

app.controller('GameController', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    console.log("called game controller");
    $scope.success = false;
    socket.emit('getGame', $routeParams.sentenceId);
    $("#next-word-textbox").focus();
    $scope.submitWord = function(word) {
      console.log("Word: ", word);
      socket.emit('word submit', word, $routeParams.sentenceId);
      $("#form").hide();
      $scope.success = true;
    };
    socket.on('words', function(words) {
      $scope.$apply(function() {
        $scope.words = words;
      });
    });
    socket.on('sentence', function(sentence) {
      $scope.$apply(function() {
        $scope.sentence = sentence.text + " ";
      });
    });
}]);

// $("#next-word").animate({backgroundColor: '#b3ffda'}, {
//         duration: 2000,
//         queue: false
//       });