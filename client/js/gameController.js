var phonecatControllers = angular.module('sentencifyControllers', ['ngMessages']);

phonecatControllers.controller('GameController', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    socket.emit('getGame');
    $("#next-word-textbox").focus();
    $scope.regex = '.* .*';
    $scope.sentence = "This is the state of the sentence so far ";
    $scope.submitWord = function(word) {
      console.log("Word: ", word);
      socket.emit('word submit', word);
      $scope.nextWordTextbox = '';
    };
    socket.on('words', function(words) {
      $scope.words = words;
    });
    socket.on('sentence', function(sentence) {
      $scope.sentence = sentence.text + " ";
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