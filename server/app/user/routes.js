var express = require('express');
var router = express.Router();
var userModel = require('./models/user');
var scheduleModel = require('../schedule/models/schedule');
var moment = require('moment');

router.post('/checkin' , function(req, res) {
    var now = new Date(req.body.time);
    scheduleModel.checkin(now, function() {
      console.log('done');
    });
    res.send(`${now}`);
});

router.post('/checkout', function(req, res) {

});

router.get('/test', function(req,res) {
  var test = require('../schedule/importFromGoogle');
  res.end();
})

module.exports = router;
