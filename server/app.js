var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var nconf = require('nconf');

var app = express();

var nconf = require('nconf');
var env = (process.env.NODE_ENV !== undefined) ? process.env.NODE_ENV.trim() : 'development';

nconf.argv()
   .env()
   .file({ file: `./config.${env}.json` });

var mongoConfig = nconf.get('mongo');

var mongoose = require('mongoose');
mongoose.connect(mongoConfig.url);
mongoose.connection
  .on('error', function(err) {
    console.error('Failed to connect to Mongo:', mongoConfig.url);
    throw err;
  })
  .on('open', function() {
    console.log('Connected to Mongo:', mongoConfig.url);
  });

// view engine setup
app.set('views', [path.join(__dirname, 'app'), './views']);
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

var appRoutes = nconf.get('app').routes;
console.log('Setting up routes');
appRoutes.forEach(function(item) {
  console.log(item.url, `${__dirname}/${item.file}`);
  app.use(item.url, require(`${__dirname}/${item.file}`));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
