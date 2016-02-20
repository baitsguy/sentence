"use strict";
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongoUtil = require('./mongoUtil');
mongoUtil.connect();

app.use(express.static(__dirname + "/../client"));
app.use('/socket', express.static(__dirname + "/../node_modules/socket.io/node_modules/socket.io-client"));

require('./routes.js')(app);
http.listen(3000, function(){
    console.log('listening on *:3000');
});

io.on('connection', function(socket){
	var sentences = mongoUtil.sentences();
	sentences.find().toArray(function(err,docs) {
		if (err) {
			console.log(err);
		}
		console.log(JSON.stringify(docs));
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