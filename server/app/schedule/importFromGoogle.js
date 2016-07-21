var google = require('googleapis');
var googleAuth = require('google-auth-library');
var nconf = require('nconf');
var userModel = require('../user/models/user');
var scheduleModel = require('../schedule/models/schedule');

var googleConfig = nconf.get('google');
var calendarConfig = googleConfig.calendar;
var serviceAccount = googleConfig.serviceAccount;
var jwtClient = new google.auth.JWT(serviceAccount.client_email, null, serviceAccount.private_key, calendarConfig.scopes, null);

jwtClient.authorize(function(err, tokens) {
  if(err) throw err;

  // Get all users
  var userMap = {}
  userModel.find({}, function(err, users) {
    if(err) throw err;

    // Map all users to a dictionary so that we can perform a lookup on the object key (which will be the student id)
    users.map(function(user) {
      userMap[user.studentId] = user;
    });

    var calendar = google.calendar('v3');
    calendar.events.list({
        auth: jwtClient,
        calendarId: calendarConfig.id,
        timeMin: (new Date()).toISOString(),
        //maxResults: 30,
        singleEvents: true,
        orderBy: 'startTime',
        fields: 'description,items(description,end,endTimeUnspecified,id,originalStartTime,recurrence,recurringEventId,start,status,summary)'
    }, function (err, response) {
        if (err)  throw err;

        var events = response.items;

        scheduleModel.update({}, {status: false}, {multi:true}, function(err) {
          if(err) throw err;

          console.log(`Preparing ${events.length} events`);

          var preparedData = [];
          var bulk = scheduleModel.collection.initializeUnorderedBulkOp();
          var count = -1;

          events.map(function(event) {
            count++;
            if(event.description === undefined || event.description === '') {
              console.log(count, 'No student id found for event', event.id);
              return;
            }

            var studentId = parseInt(event.description.trim());
            var user = userMap[studentId];
            // If no user is found in the map, skip this event
            if(user !== undefined) {
              var data = {
                _id: event.id,
                start: new Date(event.start.dateTime),
                end: new Date(event.end.dateTime),
                user: {
                  _id: user._id,
                  name: user.name
                },
                status: true
              }
              bulk.find({'_id': event.id}).upsert().update({$set: data});
            } else {
              console.log(count, 'No user found in map for student id', event.description);
            }
          });

          bulk.execute(function(err, result) {
            if(err) throw err;
            console.log('Done');
          });
        });
    });
  });
});
