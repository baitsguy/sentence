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
    socket.on('getGame', function(sentenceId){
        console.log("starting game");
        var sentencesCon = mongoUtil.sentencesCon();
        var votesCon = mongoUtil.votesCon();
        var wordsCon = mongoUtil.wordsCon();

        mongoUtil.sentencesCon().find({ "_id": mongoUtil.ObjectID(sentenceId) })
        .next(function(err, doc){
            if (err) {
                console.log(err);
            }
            sentence = doc;
            io.emit('sentence', sentence);
        });

        mongoUtil.votesCon().find({ "sentence_id": mongoUtil.ObjectID(sentenceId), completed_at: { $exists: false }})
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
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('word submit', function(word){
        var query = {word: word}; // Need to add "game_id" to query once added
        var update = {$inc: {numVotes: 1}};
        mongoUtil.wordsCon().findOneAndUpdate(query, update, {upsert: true}, function(err, res){
            if (err) {
                console.log(err);
            }
            console.log("Word Update: ", res);
        });
        console.log('Word: ' + word);
    });
});