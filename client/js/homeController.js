var app = angular.module('sentencifyControllers', ['ngRoute']);

app.controller('HomeController', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    console.log("called home controller");
    socket.emit('getSentences');
    $scope.helloworld = "lala";
    socket.on('sentences', function(sentences) {
      $scope.$apply(function() {
        $scope.sentenceTextList = sentences;
    });
    });
}]);

app.controller('GameController', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    console.log("called game controller");
    socket.emit('getGame', $routeParams.sentenceId);
    $("#next-word-textbox").focus();
    $scope.submitWord = function(word) {
      console.log("Word: ", word);
      socket.emit('word submit', word);
      $scope.nextWordTextbox = '';
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

function submitWord() {
  $("#next-word-textbox").hide();
  $("#user-message").text("Your word has been submitted! Wait another 10 seconds to try and play the next word.");
  $("#user-message").removeClass("pink");
  $("#user-message").addClass("green");
}

// $("#next-word").animate({backgroundColor: '#b3ffda'}, {
//         duration: 2000,
//         queue: false
//       });