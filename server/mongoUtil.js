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

    createNewVote: function(sentenceId, ip, callback) {
        var _this = this;
    	var voteEndDate = scheduler.getNextVoteEnd();
    	var data = { sentence_id: ObjectID(sentenceId), createdAt: new Date(), completedAt: voteEndDate};
        _db.collection('votes').insertOne(data, function(err, result){
            if (err) {
                console.log(err);
            }
            _this.findInsertedVote(sentenceId, result.insertedId, ip, callback);
        });
    },

    findInsertedVote: function(sentenceId, voteId, ip, callback) {
        _db.collection('votes').find({_id: voteId})
        .next(function(err, vote){
            console.log("Result of insert: ", vote);
            callback(sentenceId, vote, ip);
        });
    },

    createSentence: function(ip, callback) {
        var _this = this;
        _db.collection('sentences').insertOne({createdAt: new Date(), text: ''}, function(err, result){
            if (err) {
                console.log(err);
            }
            _this.createNewVote(result.insertedId, ip, callback);
        });
    },

    appendWinningWordToSentence: function(word, sentenceId, callback) {
    	var _this = this;
        var query = {_id: ObjectID(sentenceId)};
        _db.collection('sentences').find(query).limit(1)
        .next(function(err, sentence){
            console.log("Sentence before append: ", sentence);
            var nextSentence = ((sentence.text) ? sentence.text + " " : "") + word;
            var update = {$set: {text: nextSentence}};
            _db.collection('sentences').findOneAndUpdate(query,update, {}, function(err, result){
            	_this.returnUpdatedSentence(sentenceId, callback);
            });
        });
    },

    returnUpdatedSentence: function(sentenceId, callback) {
        var query = {_id: ObjectID(sentenceId)};
        _db.collection('sentences').find(query).limit(1)
        .next(function(err, sentence){
        	callback(sentenceId, 'update sentence', sentence);
        });
    },

    endGame: function(sentenceId, callback) {
        var _this = this;
        console.log("Ending game");
        var query = { _id: ObjectID(sentenceId) };
        var update = {$set: {completedAt: new Date()}};
        _db.collection('sentences').findAndModify(query, [], update, {}, function(err, sentence){
            if (err) {
                console.log(err);
            }
            console.log("Doc is: ", sentence.value);
            callback(sentenceId, 'update sentence', sentence.value);
            _this.getSentences(true, callback);
        });
    },

    getSentences: function(onlyActive, callback) {
    	var sentenceArr = [];
        var query = (onlyActive) ? { completedAt: { $exists: false } }  : { completedAt: { $exists: true } };
        _db.collection('sentences').find(query).limit( 10 ).toArray(function(err, sentences){
        	var count = sentences.length;
        	sentences.forEach(function(sentence){
		        _db.collection('votes').find({sentence_id: ObjectID(sentence._id), voteDone: {$exists: false}})
		        .next(function(err, vote){
		        	if (err) {
		        		console.log(err);
		        	}
		        	var tempSentence = {sentence: sentence, voteEndTime: ((vote && onlyActive) ? vote.completedAt : null)};
		        	sentenceArr.push(tempSentence);
		        	count--;
		        	if (count <= 0) {
		        		callback(null, 'sentences', sentenceArr);
		        	}
		        });
        	});
        });
    },

    getSentence: function(sentenceId, callback) {
    	_db.collection('sentences').find({ "_id": ObjectID(sentenceId) })
        .next(function(err, sentence){
            if (err) {
                console.log(err);
            }
            callback(sentenceId, 'sentence', sentence);
        });
    },

    getWords: function(sentenceId, voteId, callback) {
        _db.collection('words').find({ vote_id: ObjectID(voteId)}).sort({numVotes: -1}).limit(10)
        .toArray(function(err, words){
            if (err) {
                console.log(err);
            }
            console.log(words);
            callback(sentenceId, 'words', words);
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
            callback(sentenceId, 'vote', vote);

            if (vote) {
            	_this.getWords(sentenceId, vote._id, callback);
            }
        });
    },

    getSentenceDetails: function(sentenceId, callback) {
    	this.getSentence(sentenceId, callback);
        this.getVote(sentenceId, callback);
    },

    submitWord: function(sentenceId, word, ip, callback, voterCallback) {
        var _this = this;
        _db.collection('votes').find({ sentence_id: ObjectID(sentenceId), voteDone: {$exists: false}})
        .next(function(err, vote){
            _this.checkVoter(sentenceId, vote._id, word, ip, callback, voterCallback);
        });
    },

    checkVoter: function(sentenceId, voteId, word, ip, callback, voterCallback) {
        var _this = this;
        var query = {vote_id: voteId, ip: ip};
        _db.collection('voters').find(query).next(function(err, voter) {
            if (err) {
                console.log(err);
            }
           console.log('voter: ', voter);
            if(voter) {
                voterCallback(ip, 'already voted');
                callback(sentenceId);
            } else {
                _this.insertWord(sentenceId, voteId, word, ip, callback);
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
            console.log("Voter Id: ", result.insertedId);
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
