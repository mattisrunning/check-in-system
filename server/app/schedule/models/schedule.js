var mongoose = require('mongoose');
var nconf = require('nconf');
var moment = require('moment');
var i18n = require('i18n');
var scheduleConst = require('../constants');
var util = require('util');

var appConfig = nconf.get('app');

var schema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    start: Date,
    end: Date,
    user: {
        _id: mongoose.Schema.Types.ObjectId,
        name:String
    },
    status: {type: Boolean, default: true, index: true}
});

schema.statics.canCheckOut = function(userId, currentDate, callback) {
  if (callback === undefined || typeof callback !== 'function') {
      throw new Error('Callback not provided');
  }

  var response = {};
}

/**
 * Determines if a checkin is valid
 * @param  {Number}   studentId   Student ID
 * @param  {Date}     currentDate Date object with current time
 * @param  {Function} callback    callback function
 * @return {[type]}               [description]
 */
schema.statics.canCheckIn = function(userId, currentDate) {
  // if (callback === undefined || typeof callback !== 'function') {
  //     throw new Error('Callback not provided');
  // }

  var response = {status: 0, allowed: false, message: ''}
  var start = moment().utc().startOf('day');
  var end = moment().utc().startOf('day').add(1, 'days'); // There should be a shorter way to do this
  var that = this;
  console.log(currentDate);

  return new Promise(function(resolve, reject) {
    var aggregation = [
      // Find all schedules belonging to the user for the day
      {
        $match: {
        	start: {$gte: start.toDate()},
        	end: {$lte: end.toDate()},
        	"user._id": new mongoose.Types.ObjectId(userId)
        }
      },
      //Calculate the buffered start/end times
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
    ];

    that.aggregate(aggregation, function(err, shifts) {
      if (err) throw err;
      if (shifts.length > 0) {
        var shift = shifts[0];

        if(currentDate >= shift.bEndMinus) { // Checkin is too late. Right before shift ends
          response.status = scheduleConst.CHECKIN_TOO_LATE;
          response.message = __('CHECKIN_TOO_LATE');
        } else if (currentDate >= shift.bStartMinus && currentDate <= shift.bStartPlus) { // Checkin within buffered start times
          response.allowed = true;
          respone.status = scheduleConst.CHECKIN_NORMAL;
          response.message = __('CHECKIN_NORMAL');
        } else { // Checkin is late
          response.allowed = true;
          response.status = scheduleConst.CHECKIN_LATE;
          response.message = __('CHECKIN_LATE');
        }

      } else { // No shift found for current checkin time
        response.status = scheduleConst.CHECKIN_NO_SHIFTS;
        response.message = __('CHECKIN_NO_SHIFTS');
      }

      resolve(response);
    });
  });
}

module.exports = mongoose.model("schedule", schema);
