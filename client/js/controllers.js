var app = angular.module('sentencifyControllers', ['ngRoute']);

app.controller('HomeController', ['$scope', '$routeParams', '$window',
  function($scope, $routeParams, $window) {
    var socket = io();
    console.log("called home controller");
    socket.emit('get sentences');
    $scope.helloworld = "lala";
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

    $scope.createGame = function() {
      socket.emit('create game');
    };
}]);

app.controller('GameController', ['$scope', '$http', '$routeParams',
  function($scope, $http, $routeParams) {
    //var socket = io($routeParams.sentenceId);
    var socket = io();
    console.log("called game controller");
    $("#form").hide();
    $("#tags").hide();
    $scope.success = false;
    socket.emit('join sentence', $routeParams.sentenceId);
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
          $scope.nextWordTextbox = word;
          $scope.success = true;
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
      //Reopen everything
      $scope.$apply(function() {
        $scope.words = [];
        $("#form").show();
        $("#tags").show();
        $scope.success = false;
      });
    });
    socket.on('vote start', function() {
      //Reopen everything
      $scope.$apply(function() {
        $scope.words = [];
        $("#form").show();
        $("#tags").show();
        $scope.success = false;
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
      $scope.$apply(function() {
        $scope.vote = vote.text + " ";
        $("#form").show();
        $("#tags").show();
      });
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