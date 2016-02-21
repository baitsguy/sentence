"use strict";

var mongo = require('mongodb');
var client = mongo.MongoClient;
var ObjectID = mongo.ObjectID;
var _db;

module.exports = {
	connect: function() {
		client.connect('mongodb://localhost:27017/sentence-dev', function(err, db) {
			if (err) {
				console.log("Error connecting to mongo - check mongod connection");
				process.exit(1);
			}
			_db = db;
			console.log("Connected to Mongo");
		});
	},

	sentencesCon: function() {
		console.log("Retrieving sentences collection from _db");
		return _db.collection('sentences');
	},

	votesCon: function() {
		console.log("Retrieving votes collection from _db");
		return _db.collection('votes');
	},

	wordsCon: function() {
		console.log("Retrieving words collection from _db");
		return _db.collection('words');
	},

	ObjectID: function(idStr) {
		return ObjectID(idStr);
	},

	setVoteCompletedAt: function(sentenceId) {
		var query = { sentence_id: ObjectID(sentenceId), completedAt: {$exists: false}};
        var update = {$set: {completedAt: new Date()}};
        console.log("Querying with: ", query);
        console.log("Then running update: ", update);
        _db.collection('votes').findOneAndUpdate(query, update, {});
	},

    setWinningWordForVote: function(wordId, sentenceId) {
	    var query = {sentence_id: ObjectID(sentenceId)};
	    var update = {$set: {winningWord: ObjectID(wordId)}};
	    console.log("Setting winning word with id: ", wordId);
	    _db.collection('votes').findOneAndUpdate(query, update, {});
    },

    createNewVote: function(sentenceId) {
        _db.collection('votes').insertOne({ sentence_id: ObjectID(sentenceId), createdAt: new Date()}, function(err, result){
            if (err) {
                console.log(err);
            }
            _db.collection('votes').find({_id: result.insertedId})
            .next(function(err, vote){
                console.log("Result of insert: ", vote);
            });
        });
    }
};
