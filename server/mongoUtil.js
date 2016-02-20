"use strict";

var mongo = require('mongodb');
var client = mongo.MongoClient;
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

	sentences: function() {
		console.log("Retrieving sentences collection from _db");
		return _db.collection('sentences');
	},

	votes: function() {
		console.log("Retrieving votes collection from _db");
		return _db.collection('votes');
	},

	words: function() {
		console.log("Retrieving words collection from _db");
		return _db.collection('words');
	}
};
