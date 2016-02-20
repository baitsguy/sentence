"use strict";
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sentence;
var vote;

var mongoUtil = require('./mongoUtil');
mongoUtil.connect();

app.use(express.static(__dirname + "/../client"));
app.use('/socket', express.static(__dirname + "/../node_modules/socket.io/node_modules/socket.io-client"));

require('./routes.js')(app);
http.listen(3000, function(){
    console.log('listening on *:3000');
});

app.get("/game/:sentenceId", function(request, response) {
    var sentenceId = request.params.sentenceId;

    var sentencesCon = mongoUtil.sentences();
    var votesCon = mongoUtil.votes();
    var wordsCon = mongoUtil.words();

    sentence = sentencesCon.find({ "_id": sentenceId }).next();
    vote = votesCon.find({ "sentence_id": sentenceId, completed_at: { $exists: false }}).next();
    var wordsCursor = wordsCon.find({ vote_id: vote['id']});
    var words = [];
    wordsCursor.forEach(function(word) {
        words.push(word);
    });

    response.json({ "sentence": sentence, "vote": vote, "words": words});
});

io.on('connection', function(socket){
    if(sentence) {
        socket.join(sentence._id.toString());
    }
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