"use strict";
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var job;

var mongoUtil = require('./mongoUtil');
mongoUtil.connect();

var scheduler = require('./scheduler');

app.use(express.static(__dirname + "/../client"));
app.use('/socket', express.static(__dirname + "/../node_modules/socket.io/node_modules/socket.io-client"));

//require('./routes.js')(app);
http.listen(3000, function(){
    console.log('listening on *:3000');
});

app.get('/', function(req, res) {
    res.sendfile('./client/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});


app.get('/home', function(req, res) {
    res.sendfile('./client/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

app.get("/game/:sentenceId", function(request, response) {
    console.log("Sentence id: ", request.params.sentenceId);
    response.sendfile('./client/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

io.on('connection', function(socket){
    socket.on('getSentences', function() {
        mongoUtil.getSentences(emitGameObject);
    });

    socket.on('create game', function(){
        console.log("creating a game");
        mongoUtil.createSentence(emitGameObject);
    });

    socket.on('getGame', function(sentenceId){
        console.log("starting game");

        resetTimer(sentenceId);
        sendDetailsForSentences(sentenceId);
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('word submit', function(word, sentenceId){
        mongoUtil.submitWord(sentenceId, word, sendDetailsForSentences);
    });
});

function emitGameObject(objTypeStr, object) {
    console.log(objTypeStr + ((object) ? " object: " : ""), object);
    if (object) {
        io.emit(objTypeStr, object);
    } else {
        io.emit(objTypeStr);
    }
};

function resetTimer(sentenceId) {
    job = scheduler.scheduleNextVoteEnd(sentenceId, voteEnd);
};

function voteEnd(sentenceId){
    console.log("Voting Ended!");
    job.cancel();
    io.emit('vote end');
    var isEndOfGame = false;
    // Check votes and append highest vote to current sentence
    mongoUtil.setVoteCompletedAt(sentenceId);
    mongoUtil.voteEnd(sentenceId, isEndOfGame, resetTimer, emitGameObject);
};

function sendDetailsForSentences(sentenceId) {
    mongoUtil.getSentenceDetails(sentenceId, emitGameObject);
};
