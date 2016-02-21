"use strict";

var mongo = require('mongodb');
var client = mongo.MongoClient;
var ObjectID = mongo.ObjectID;
var _db;

var scheduler = require('./scheduler');

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

	ObjectID: function(idStr) {
		return ObjectID(idStr);
	},

	setVoteDone: function(sentenceId) {
		var query = { sentence_id: ObjectID(sentenceId), voteDone: {$exists: false}};
        var update = {$set: {voteDone: true}};
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

    createNewVote: function(sentenceId, callback) {
    	var voteEndDate = scheduler.getNextVoteEnd();
    	var data = { sentence_id: ObjectID(sentenceId), createdAt: new Date(), completedAt: voteEndDate};
        _db.collection('votes').insertOne(data, function(err, result){
            if (err) {
                console.log(err);
            }
            _db.collection('votes').find({_id: result.insertedId})
            .next(function(err, vote){
                console.log("Result of insert: ", vote);
                callback(sentenceId, vote);
            });
        });
    },

    createSentence: function(callback) {
        var _this = this;
        _db.collection('sentences').insertOne({createdAt: new Date(), text: ''}, function(err, result){
            if (err) {
                console.log(err);
            }
            _this.createNewVote(result.insertedId, callback);
        });
    },

    appendWinningWordToSentence: function(word, sentenceId, callback) {
        var query = {_id: ObjectID(sentenceId)};
        _db.collection('sentences').find(query).limit(1)
        .next(function(err, sentence){
            console.log("Sentence before append: ", sentence);
            var nextSentence = sentence.text + " " + word;
            callback('update sentence', nextSentence);
            var update = {$set: {text: nextSentence}};
            _db.collection('sentences').findOneAndUpdate(query,update, {});
        });
    },

    endGame: function(sentenceId, callback) {
        console.log("Ending game");
        var query = { _id: ObjectID(sentenceId) };
        var update = {$set: {completedAt: new Date()}};
        _db.collection('sentences').findAndModify(query, [], update, {}, function(err, doc){
            if (err) {
                console.log(err);
            }
            console.log("Doc is: ", doc.value.text);
            callback('update sentence', doc.value.text);
        });
    },

    getSentences: function(onlyActive, callback) {
        var query = (onlyActive) ? { completedAt: { $exists: false } }  : { completedAt: { $exists: true } };
        _db.collection('sentences').find(query).limit( 10 ).toArray(function(err, sentences){
            if (err) {
                console.log(err);
            }
            console.log(sentences);
            callback('sentences', sentences);
        });
    },

    getSentence: function(sentenceId, callback) {
    	_db.collection('sentences').find({ "_id": ObjectID(sentenceId) })
        .next(function(err, sentence){
            if (err) {
                console.log(err);
            }
            callback('sentence', sentence);
        });
    },

    getWords: function(voteId, callback) {
        _db.collection('words').find({ vote_id: ObjectID(voteId)}).sort({numVotes: -1}).limit(10)
        .toArray(function(err, words){
            if (err) {
                console.log(err);
            }
            console.log(words);
            callback('words', words);
        });
    },

    getVote: function(sentenceId, callback) {
    	var _this = this;
    	_db.collection('votes').find({ "sentence_id": ObjectID(sentenceId), voteDone: { $exists: false }})
        .next(function(err,vote){
            if (err) {
                console.log(err);
            }
            console.log(vote);
            callback('vote', vote);

            _this.getWords(vote._id, callback);
        });
    },

    getSentenceDetails: function(sentenceId, callback) {
    	this.getSentence(sentenceId, callback);
        this.getVote(sentenceId, callback);
    },

    submitWord: function(sentenceId, word, ip, callback) {
        var _this = this;
        _db.collection('votes').find({ sentence_id: ObjectID(sentenceId), voteDone: {$exists: false}})
        .next(function(err, vote){
            _this.checkVoter(sentenceId, vote._id, word, ip, callback);
        });
    },

    checkVoter: function(sentenceId, voteId, word, ip, callback) {
        var _this = this;
        var query = {vote_id: voteId, ip: ip};
        _db.collection('voters').find(query).next(function(err, voter) {
            if (err) {
                console.log(err);
            }
           console.log('voter: ', voter);
            if(voter) {
                callback(sentenceId);
            } else {
                _this.insertWord(sentenceId, voteId, word, callback);
            }
        });
    },

    insertWord: function(sentenceId, voteId, word, ip, callback) {
        var _this = this;
        var query = {word: word, vote_id: voteId}; // Need to add "game_id" to query once added
        var update = {$inc: {numVotes: 1}};
        _db.collection('words').findOneAndUpdate(query, update, {upsert: true}, function(err, res){
            if (err) {
                console.log(err);
            }
            console.log("Word Update: ", res);
            _this.insertVoter(voteId, ip);
            callback(sentenceId);
        });
    },

    insertVoter: function(voteId, ip) {
        _db.collection('voters').insertOne({ vote_id: ObjectID(voteId), ip: ip}, function(err, result){
            if (err) {
                console.log(err);
            }
            _db.collection('voters').find({_id: result.insertedId})
            .next(function(err, voter){
                console.log("Voter: ", voter);
            });
        });
    },

    voteEnd: function(sentenceId, isGameEnd, callback) {
    	var _this = this;
	    _db.collection('votes').find({ sentence_id: ObjectID(sentenceId) }).sort({completedAt: -1}).limit(1)
	    .next(function(err, vote){
	        _db.collection('words').find({vote_id: ObjectID(vote._id)}).sort({numVotes: -1}).limit(1)
	        .next(function(err, word){
                console.log("Returned word: ", word);
                if (err) {
                    console.log(err);
                }
                callback(sentenceId, word, isGameEnd);
	        });
	    });
    }
};
