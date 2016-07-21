var express = require('express');
var router = express.Router();
var userModel = require('./models/user');
var scheduleModel = require('../schedule/models/schedule');
var moment = require('moment');

var output = {
  status: 200
}

router.get('/studentId/:id', function(req, res) {
  var studentId = req.params.id;
  userModel.findOne({studentId}, function(err, user) {
    if(err) {
      console.error(err);
      output.status = 500;
      output.error = err;
      res.status(output.status).json(output);
    } else {
      if(!user) {
        output.status  = 404;
        output.error = 'Student ID not found';
        res.status(output.status).json(output);
      } else {
        output.user = {
          id: user._id
        }
        res.status(output.status).json(output);
      }
    }
  });
});

router.post('/checkin' , function(req, res) {
    var now = (req.body.time) ? new Date(req.body.time) : new Date();
    var studentId = parseInt(req.body.studentId);

    console.log(req.body);
    userModel.findOne({studentId}, function(err, user) {
      console.log(user);
      if(err) {
        console.error(err);
        output.status = 500;
        output.error = err;
        res.status(output.status).json(output);
      } else {
        if(user) {
          scheduleModel.canCheckin(user._id, now, function() {
            console.log('done');
            res.send(`${now}`);
          });
        } else {
          output.status  = 404;
          output.error = 'Student ID not found';
          res.status(output.status).json(output);
        }
      }
    });
});

router.post('/checkout', function(req, res) {

});

router.get('/test', function(req,res) {
  var test = require('../schedule/importFromGoogle');
  res.end();
})

module.exports = router;
