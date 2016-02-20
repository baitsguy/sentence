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
			response.sendStatus(400);
		}
		console.log(JSON.stringify(docs));
	});

    console.log('a user connected');

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('word submit', function(word){
        console.log('Word: ' + word);
    });
});