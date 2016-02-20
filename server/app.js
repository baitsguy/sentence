"use strict";
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sentence;
var vote;
var sentenceId;

var mongoUtil = require('./mongoUtil');
mongoUtil.connect();

app.use(express.static(__dirname + "/../client"));
app.use('/socket', express.static(__dirname + "/../node_modules/socket.io/node_modules/socket.io-client"));

require('./routes.js')(app);
http.listen(3000, function(){
    console.log('listening on *:3000');
});

app.get("/game/:sentenceId", function(request, response) {
    sentenceId = request.params.sentenceId;
    console.log("Sentence id: ", sentenceId);
});

io.on('connection', function(socket){


    if(sentenceId) {
        socket.join(sentenceId);
    }

    var sentencesCon = mongoUtil.sentences();
    var votesCon = mongoUtil.votes();
    var wordsCon = mongoUtil.words();

    sentencesCon.find({ "_id": mongoUtil.ObjectID(sentenceId) }).next(function(err, doc){
		if (err) {
			console.log(err);
		}
		console.log(doc);
		sentence = doc;
		io.emit('sentence', sentence);
    });

	votesCon.find({ "sentence_id": mongoUtil.ObjectID(sentenceId), completed_at: { $exists: false }}).next(function(err,doc){
		if (err) {
			console.log(err);
		}
		console.log(doc);
		vote = doc;
		io.emit('vote', vote);

		var words = [];
		wordsCon.find({ vote_id: mongoUtil.ObjectID(vote._id)}).toArray(function(err, docs){
			if (err) {
				console.log(err);
			}
			console.log(docs);
			words = docs;
			io.emit('words', words);
		});
	});


    console.log('a user connected');

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('word submit', function(word){
    	var words = mongoUtil.words();
    	var query = {word: word}; // Need to add "game_id" to query once added
    	var update = {$inc: {numVotes: 1}};
    	words.findOneAndUpdate(query, update, {upsert: true}, function(err, res){
    		if (err) {
    			console.log(err);
    		}
    		console.log("Word Update: ", res);
    	});
        console.log('Word: ' + word);
    });
});