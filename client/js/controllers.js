var app = angular.module('sentencifyControllers', ['ngRoute']);

app.controller('AboutController', ['$scope', '$http','$window',
  function($scope, $http, $window) {
    $scope.playGame = function() {
      $window.location.href = '/sentences';
    };
  }]);

app.controller('HomeController', ['$scope', '$http', '$routeParams', '$window',
  function($scope, $http, $routeParams, $window) {
    var socket = io();
    $scope.formVisible = false;
    console.log("called home controller");
    socket.emit('get sentences');
    $scope.listActiveSentences = true;
    socket.on('sentences', function(sentenceDetails) {
      console.log("sentence details are ", sentenceDetails);
      $scope.$apply(function() {
        for(var i=0; i < sentenceDetails.length; i++) {
          sentenceDetails[i].secondsLeft = parseInt(
            (new Date(sentenceDetails[i].voteEndTime) - new Date().getTime())/1000);
        }
        $scope.sentenceDetailsList = sentenceDetails;
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

    $scope.createGame = function(period) {
      if (period <= 0 || period == null) {
        period = 30;
      }
      console.log("period", period);
      var json = 'http://ipv4.myexternalip.com/json';
      $http.get(json).then(function(result) {
          var ip = "none";
          ip = result.data.ip;
          socket.emit('create sentence', period, ip);
      }, function(e) {
          alert("Error in determining your session context." +
            "Check to make sure you don't have a firewall blocking " +
            "off the internet.");
      });
    };
    $scope.flipList = function() {
      $scope.listActiveSentences = !$scope.listActiveSentences;
      if ($scope.listActiveSentences) {
        socket.emit('get sentences');
      } else {
        socket.emit('get all sentences');
      }
    };
  }]);

app.controller('GameController', ['$scope', '$timeout', '$http', '$routeParams',
  function($scope, $timeout, $http, $routeParams) {
    var socket = io();
    console.log("called game controller");
    $timeout(function() { $('#nextWordTextbox').focus(); });
    $scope.wordSubmitted = false;
    //Initialize to 30 seconds from now
    $scope.voteEndTime = new Date(new Date().getTime() + 30000);
    timer($scope, $timeout);
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
    socket.on('vote start', function(vote) {
      console.log("Vote start!", vote);

      //Reopen everything
      $scope.$apply(function() {
        $scope.words = [];
        $scope.wordSubmitted = false;
        $scope.voteEndTime = vote.completedAt;
        $scope.nextWordTextbox = "";
        $timeout(function() { $('#nextWordTextbox').focus(); });

      });
    });
    socket.on('sentence', function(sentence) {
      $scope.$apply(function() {
        $scope.sentence = sentence.text + " ";
        console.log("Sentnece is ", sentence);
        $scope.gameEnded = sentence.completedAt != null
        angular.element('#sentence').css('font-size', Math.max(3, 100/sentence.text.length) +"em");
      });
    });
    socket.on('update sentence', function(sentence) {
      $scope.$apply(function() {
        $scope.sentence = sentence.text + " ";
      });
    });
    socket.on('game end', function(sentence) {
      $scope.$apply(function() {
        $scope.gameEnded = true;
      });
    });
    socket.on('vote', function(vote) {
      console.log("Got votes: ", vote);
      if (vote) {
        $scope.$apply(function() {
          $scope.vote = vote.text + " ";
          $scope.voteEndTime = vote.completedAt;
        });
      }
    });
}]);

function timer($scope,$timeout) {
    $scope.onTimeout = function(){
        $scope.timeRemaining = parseInt((new Date($scope.voteEndTime) - new Date().getTime())/1000);
        if ($scope.timeRemaining < 0) {
          $scope.timeRemaining = 0;
          $scope.stopTimer();
        }
        mytimeout = $timeout($scope.onTimeout,900);
    }
    var mytimeout = $timeout($scope.onTimeout,900);

    $scope.stopTimer = function(){
        $timeout.cancel(mytimeout);
    }
}
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