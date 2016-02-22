"use strict";
var schedule = require('node-schedule');

function formatDate(date) {
	return ('{0}-{1}-{3} {4}:{5}:{6}').replace('{0}', date.getFullYear()).replace('{1}', date.getMonth() + 1).replace('{3}', date.getDay()).replace('{4}', date.getHours()).replace('{5}', date.getMinutes()).replace('{6}', date.getSeconds());
}

module.exports = {

	getNextVoteEnd: function(voteLength) {
		var dateNow = new Date();
		var offset = (voteLength) ? voteLength * 1000 : 30000;
	    var nextVoteEnd = new Date(dateNow.getTime() + (offset));
	    console.log("Scheduling next vote end for: ", formatDate(nextVoteEnd));
	    return nextVoteEnd;
	},

	scheduleNextVoteEnd: function(sentenceId, nextVoteEnd, callback){
		return schedule.scheduleJob(nextVoteEnd, function(){
			callback(sentenceId);
		});
	}
};
