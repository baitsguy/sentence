"use strict";
var schedule = require('node-schedule');

var formatDate = function(date) {
	return ('{0}-{1}-{3} {4}:{5}:{6}').replace('{0}', date.getFullYear()).replace('{1}', date.getMonth() + 1).replace('{3}', date.getDay()).replace('{4}', date.getHours()).replace('{5}', date.getMinutes()).replace('{6}', date.getSeconds());
}

module.exports = {

	getNextVoteEnd: function() {
		var dateNow = new Date();
	    var nextVoteEnd = new Date(dateNow.getTime() + (15000));
	    console.log("Scheduling next vote end for: ", formatDate(nextVoteEnd));
	    return nextVoteEnd;
	},

	scheduleJob: schedule.scheduleJob
};
