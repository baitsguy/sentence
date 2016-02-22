var app = angular.module('sentencifyControllers', ['ngRoute']);

app.controller('HomeController', ['$scope', '$http', '$routeParams', '$window',
  function($scope, $http, $routeParams, $window) {
    var socket = io();
    console.log("called home controller");
    socket.emit('get all sentences');
    $scope.listOnlyActiveSentences = false;
    socket.on('sentences', function(sentences) {
      $scope.$apply(function() {
        $scope.sentenceTextList = sentences;
      });
    });
    socket.on('new sentence', function(sentenceId) {
      $scope.$apply(function() {
        $scope.sentenceTextList.push({value:sentenceId});
      });
    });
    socket.on('new sentence callback', function(sentenceId) {
      $window.location.href = '/game/' + sentenceId;
    });

    $scope.createGame = function() {
      var json = 'http://ipv4.myexternalip.com/json';
      $http.get(json).then(function(result) {
          var ip = "none";
          ip = result.data.ip;
          socket.emit('create sentence', ip);
      }, function(e) {
          alert("Error in determining your session context." +
            "Check to make sure you don't have a firewall blocking " +
            "off the internet.");
      });
    };
    $scope.listOnlyActiveSentencesChange = function() {
      if ($scope.listOnlyActiveSentences==true) {
        socket.emit('get sentences');
      } else {
        socket.emit('get all sentences');
      }
    };
  }]);

app.controller('GameController', ['$scope', '$http', '$routeParams',
  function($scope, $http, $routeParams) {
    var socket = io();
    console.log("called game controller");
    $scope.wordSubmitted = false;
    $scope.activeGame = false;
    socket.emit('join', $routeParams.sentenceId);
    socket.emit('get sentence', $routeParams.sentenceId);
    $("#next-word-textbox").focus();
    $scope.submitWord = function(word) {
      var json = 'http://ipv4.myexternalip.com/json';
      $http.get(json).then(function(result) {
          var ip = "none";
          ip = result.data.ip;
          console.log("ip is", ip);
          console.log("Word: ", word);
          socket.emit('word submit', word, $routeParams.sentenceId, ip);
          socket.emit('join', ip);
          $scope.nextWordTextbox = word;
          $scope.wordSubmitted = true;
      }, function(e) {
          alert("Error in determining your session context." +
            "Check to make sure you don't have a firewall blocking " +
            "off the internet.");
      });
    };
    socket.on('words', function(words) {
      console.log("Got words: ", words);
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
        $scope.words = shuffle(words);
      });
    });
    socket.on('vote start', function() {
      console.log("Vote start!");

      //Reopen everything
      $scope.$apply(function() {
        $scope.words = [];
        $scope.wordSubmitted = false;
      });
    });
    socket.on('sentence', function(sentence) {
      $scope.$apply(function() {
        $scope.sentence = sentence.text + " ";
      });
    });
    socket.on('update sentence', function(sentence) {
      $scope.$apply(function() {
        $scope.sentence = sentence.text + " ";
      });
    });
    socket.on('vote', function(vote) {
      console.log("Got votes: ", vote);
      if (vote) {
        $scope.$apply(function() {
          $scope.vote = vote.text + " ";
          $scope.activeGame = true;
        });
      }
    });
}]);

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// $("#next-word").animate({backgroundColor: '#b3ffda'}, {
//         duration: 2000,
//         queue: false
//       });