var express = require('express');
var router = express.Router();
var moment = require('moment');
var viewBase = `${__dirname}/views`;
var userModel = require(global.appRoot+'/app/user/models/user');
var scheduleModel = require(global.appRoot+'/app/schedule/models/schedule');

var pageData = {
  layout: 'checkinLayout'
}

router.get('/:userId', function(req, res) {
  userModel.findOne({_id: req.params.userId}, function(err, user) {
    if(err) {
      res.status(500).send(err);
    } else {
      if(!user) {
        res.status(404).end();
      } else {
        var now = (req.body.time) ? new Date(req.body.time) : new Date();
        scheduleModel.canCheckIn(user.id, now)
          .then(function(checkinStatus) {
            console.log(checkinStatus);
            pageData.checkinStatus = checkinStatus;
            pageData.title = `Welcome, ${user.name}`;

            res.render(`${viewBase}/dashboard`, pageData);
          })
          .catch(function(err) {
            console.log(err);
          });
      }
    }
  });
});

router.get('/' , function(req, res) {
  pageData.title = 'Checkin!';
  res.render(`${viewBase}/index`, pageData);
});

module.exports = router;
