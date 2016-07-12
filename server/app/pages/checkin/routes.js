var express = require('express');
var router = express.Router();
var moment = require('moment');
var viewBase = `${__dirname}/views`;

router.get('/' , function(req, res) {
  res.render(`${viewBase}/index`, {title: 'Checkin Now!', layout: 'layout'});
});

module.exports = router;
