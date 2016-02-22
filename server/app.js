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

    socket.on('join', function(roomName) {
        socket.join(roomName);
    });

    socket.on('get sentences', function() {
        mongoUtil.getSentences(true, emitGameObject);
    });

    socket.on('create sentence', function(ip){
        socket.join(ip);
        mongoUtil.createSentence(ip, gameStart);
    });

    socket.on('get all sentences', function() {
        mongoUtil.getSentences(false, emitGameObject);
    });

    socket.on('get sentence', function(sentenceId){
        console.log("starting game");
        sendDetailsForSentences(sentenceId);
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('word submit', function(word, sentenceId, ip){
        mongoUtil.submitWord(sentenceId, word, ip, sendDetailsForSentences, emitGameObject);
    });
});

function emitGameObject(sentenceId, objTypeStr, object) {
    var emitter = (sentenceId) ? io.to(sentenceId) : io;
    console.log(objTypeStr + ((object) ? " object: " : ""), object);
    if (object) {
        emitter.emit(objTypeStr, object);
    } else {
        emitter.emit(objTypeStr);
    }
}

function resetTimer(sentenceId, voteEndTime) {
    job = scheduler.scheduleNextVoteEnd(sentenceId, voteEndTime, voteEnd);
}

function voteEnd(sentenceId){
    console.log("Voting Ended!");
    job.cancel();
    io.emit('vote end');
    var isEndOfGame = false;
    // Check votes and append highest vote to current sentence
    mongoUtil.setVoteDone(sentenceId);
    mongoUtil.voteEnd(sentenceId, isEndOfGame, nextRound);
}

function nextRound(sentenceId, word, isGameEnd) {
    if (!word) {
        isGameEnd = true;
    } else {
        mongoUtil.setWinningWordForVote(word._id, sentenceId);
        mongoUtil.appendWinningWordToSentence(word.word, sentenceId, emitGameObject);
    }

    // Check if end of game
    if (isGameEnd) {
        mongoUtil.endGame(sentenceId, emitGameObject);
        emitGameObject(sentenceId, 'game end');
    } else {
        mongoUtil.createNewVote(sentenceId, voteStart);
    }
}

function sendDetailsForSentences(sentenceId) {
    mongoUtil.getSentenceDetails(sentenceId, emitGameObject);
}

function gameStart(sentenceId, vote, ip) {
    resetTimer(sentenceId, vote.completedAt);
    emitGameObject(null, 'new sentence', sentenceId);
    emitGameObject(ip, 'new sentence callback', sentenceId);
}

function voteStart(sentenceId, vote, ip) {
    resetTimer(sentenceId, vote.completedAt);
    emitGameObject(sentenceId, 'vote start', vote);
}
