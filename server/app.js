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

    function endGame(sentenceId) {
        console.log("Ending game");
        var query = { _id: mongoUtil.ObjectID(sentenceId) };
        var update = {$set: {completedAt: new Date()}};
        mongoUtil.sentencesCon().findAndModify(query, [], update, {}, function(err, doc){
            if (err) {
                console.log(err);
            }
            console.log("Doc is: ", doc.value.text);
            io.emit('game end', doc.value.text);
        });
    }

    function appendWinningWordToSentence(word, sentenceId) {
        var query = {_id: mongoUtil.ObjectID(sentenceId)};
        mongoUtil.sentencesCon().find(query).limit(1)
        .next(function(err, sentence){
            console.log("Sentence before append: ", sentence);
            var nextSent = sentence.text + " " + word;
            io.emit('update sentance', nextSent);
            var update = {$set: {text: nextSent}};
            mongoUtil.sentencesCon().findOneAndUpdate(query,update, {});
        });
    }

    function resetTimer(sentenceId) {
        var voteEndDate = scheduler.getNextVoteEnd();
        job = scheduler.scheduleJob(voteEndDate, function(){
            voteEnd(sentenceId);
        });
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
                    appendWinningWordToSentence(word.word, sentenceId);
                }

                // Check if end of game
                if (isEndOfGame) {
                    endGame(sentenceId);
                } else {
                    mongoUtil.createNewVote(sentenceId);
                    resetTimer(sentenceId);
                    io.emit('vote start');
                }
            });
        });
	};


    socket.on('getGame', function(sentenceId){
        console.log("starting game");

        var voteEndDate = scheduler.getNextVoteEnd();
        job = scheduler.scheduleJob(voteEndDate, function(){
        	voteEnd(sentenceId);
        });
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
        mongoUtil.sentencesCon().find({ "_id": mongoUtil.ObjectID(sentenceId) })
        .next(function(err, doc){
            if (err) {
                console.log(err);
            }
            sentence = doc;
            io.emit('sentence', sentence);
        });

        mongoUtil.votesCon().find({ "sentence_id": mongoUtil.ObjectID(sentenceId), completedAt: { $exists: false }})
        .next(function(err,doc){

            if (err) {
                console.log(err);
            }
            console.log(doc);
            vote = doc;
            io.emit('vote', vote);

            var words = [];
            mongoUtil.wordsCon().find({ vote_id: mongoUtil.ObjectID(vote._id)})
            .toArray(function(err, docs){
                if (err) {
                    console.log(err);
                }
                console.log(docs);
                words = docs;
                io.emit('words', words);
            });
        });
    }
});