var express = require('express');
var http = require('http');
var path = require('path');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var socketIO = require('socket.io');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {error: err});
});

app.set('port', 3000);
//app.use('/static', express.static(__dirname + '/static'));

var server = http.createServer(app);
var io = socketIO(server);

// Starts the server.
server.listen(3000, function() {
  console.log('Starting server on port 3000');
});