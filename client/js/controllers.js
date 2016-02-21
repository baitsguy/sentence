var app = angular.module('sentencifyControllers', ['ngRoute']);

app.controller('HomeController', ['$scope', '$routeParams', '$window',
  function($scope, $routeParams, $window) {
    console.log("called home controller");
    socket.emit('get sentences');
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

app.controller('GameController', ['$scope', '$http', '$routeParams',
  function($scope, $http, $routeParams) {
    console.log("called game controller");
    $scope.success = false;
    socket.emit('get game', $routeParams.sentenceId);
    $("#next-word-textbox").focus();
    $scope.submitWord = function(word) {
      var json = 'http://ipv4.myexternalip.com/json';
      var ip = "none";
      $http.get(json).then(function(result) {
          ip = result.data.ip;
          console.log("ip is", ip);
          console.log("Word: ", word);
          socket.emit('word submit', word, $routeParams.sentenceId, ip);
          $("#form").hide();
          $scope.success = true;
      }, function(e) {
          alert("Error in determining your session context." +
            "Check to make sure you don't have a firewall blocking " +
            "off the internet.");
      });
    };
    socket.on('words', function(words) {
      if (words.length != 0) {
        //Set size based on votes
        var maxIndex = 0;
        var fontSize = 5;
        for(var i=0; i<words.length; i++) {
          if(words[i].numVotes > words[maxIndex].numVotes) {
            maxIndex = i;
          }
        }
        var ratio = words[maxIndex].numVotes;
        for(var i=0; i<words.length; i++) {
          words[i].size = parseInt(words[i].numVotes * fontSize/ratio);
        }
      }
      $scope.$apply(function() {
        $scope.words = words;
      });
    });
    socket.on('sentence', function(sentence) {
      $scope.$apply(function() {
        $scope.sentence = sentence.text + " ";
      });
    });
    socket.on('vote', function(vote) {
      console.log("Got votes: ", vote);
      $scope.$apply(function() {
        $scope.vote = vote.text + " ";
      });
    });
}]);

// $("#next-word").animate({backgroundColor: '#b3ffda'}, {
//         duration: 2000,
//         queue: false
//       });