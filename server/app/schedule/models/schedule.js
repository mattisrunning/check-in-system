var mongoose = require('mongoose');
var nconf = require('nconf');
var moment = require('moment');

var appConfig = nconf.get('app');

schema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    start: Date,
    end: Date,
    user: {
        _id: mongoose.Schema.Types.ObjectId,
        name:String
    },
    status: {type: Boolean, default: true, index: true}
});

/**
 * Determines if a checkin is valid
 * @param  {Number}   studentId   Student ID
 * @param  {Date}     currentDate Date object with current time
 * @param  {Function} callback    callback function
 * @return {[type]}               [description]
 */
schema.statics.checkin = function(userId, currentDate, callback) {
  if (callback === undefined || typeof callback !== 'function') {
      throw new Error('Callback not provided');
  }

  var response = {}
  var start = moment().startOf('day');
  var end = moment().endOf('day');

  this.aggregate([
    // Find all schedules belonging to the user for the day
    {
      $match: {
      	start: {$gte: start},
      	end: {$lte: end},
      	"user._id": new mongoose.Types.ObjectId(userId)
      }
    },
    // Calculate the buffered start/end times
    {
      $project: {
        start: "$start",
      	bStartMinus: {$subtract: ["$start", appConfig.bufferTime]},
      	bStartPlus: {$add: ["$start", appConfig.bufferTime]},
        end: "$end",
      	bEndMinus: {$subtract: ["$end", appConfig.bufferTime]},
      	bEndPlus: {$add: ["$end", appConfig.bufferTime]}
      }
    },
    // Find the schedule the current time falls in
    {
      $match: {
      	bStartMinus: {$lte: currentDate},
      	bEndPlus: {$gt: currentDate}
      }
    }
  ], function(err, shifts) {
    if (err) throw err;
    if (shifts.length > 0) {
      var shift = shifts[0];

      if(currentDate >= shift.bEndMinus) { // Checkin is too late. Right before shift ends
        console.log('Too late, bro!');
      } else if (currentDate >= shift.bStartMinus && currentDate <= shift.bStartPlus) { // Checkin within buffered start times
        console.log('Normal checkin');
      } else { // Checkin is late
        console.log('Late checkin');
      }
    } else {
      // No shift found for current checkin time
      console.log('No shift found');
    }

    callback(err, response);
  });
}

module.exports = mongoose.model("schedule", schema);
