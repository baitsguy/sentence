"use strict";
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sentence;
var vote;
var sentenceId;
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
        mongoUtil.sentencesCon().find().limit( 10 ).toArray(function(err, docs){
            if (err) {
                console.log(err);
            }
            console.log(docs);
            io.emit('sentences', docs);
        });
    });

    function emitSentenceId(sentenceId) {
        console.log("sentence created: ", sentenceId);
        io.emit('new sentence', sentenceId);
    }

    function emitSentenceText(sentenceText) {
        console.log("New full sentence: ", sentenceText);
        io.emit('update sentence', sentenceText);
    }

    function emitGameObject(objTypeStr, object) {
        console.log(objTypeStr + " object: ", object);
        io.emit(objTypeStr, object);
    }

    function resetTimer(sentenceId) {
        job = scheduler.scheduleNextVoteEnd(sentenceId, voteEnd);
    }

    function voteEnd(sentenceId){
    	console.log("Voting Ended!");
        job.cancel();
        io.emit('vote end');
        var isEndOfGame = false;
    	// Check votes and append highest vote to current sentence
        mongoUtil.setVoteCompletedAt(sentenceId);
        mongoUtil.votesCon().find({ sentence_id: mongoUtil.ObjectID(sentenceId) }).sort({completedAt: -1}).limit(1)
        .next(function(err, vote){
            mongoUtil.wordsCon().find({vote_id: mongoUtil.ObjectID(vote._id)}).sort({numVotes: -1}).limit(1)
            .next(function(err, word){
                console.log("Returned word: ", word);
                if (err) {
                    console.log(err);
                }

                if (!word) {
                    isEndOfGame = true;
                } else {
                    mongoUtil.setWinningWordForVote(word._id, sentenceId);
                    mongoUtil.appendWinningWordToSentence(word.word, sentenceId, emitSentenceText);
                }

                // Check if end of game
                if (isEndOfGame) {
                    mongoUtil.endGame(sentenceId, emitSentenceText);
                    io.emit('game end');
                } else {
                    mongoUtil.createNewVote(sentenceId);
                    resetTimer(sentenceId);
                    io.emit('vote start');
                }
            });
        });
	};

    socket.on('create game', function(){
        console.log("creating a game");
        mongoUtil.createSentence(emitSentenceId);
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
        mongoUtil.votesCon().find({ sentence_id: mongoUtil.ObjectID(sentenceId), completedAt: {$exists: false}})
        .next(function(err, vote){
            var query = {word: word, vote_id: vote._id}; // Need to add "game_id" to query once added
            var update = {$inc: {numVotes: 1}};
            mongoUtil.wordsCon().findOneAndUpdate(query, update, {upsert: true}, function(err, res){
                if (err) {
                    console.log(err);
                }
                console.log("Word Update: ", res);
            });
            sendDetailsForSentences(sentenceId);
        });
    });

    function sendDetailsForSentences(sentenceId) {
        mongoUtil.getSentenceDetails(sentenceId, emitGameObject);
    }
});