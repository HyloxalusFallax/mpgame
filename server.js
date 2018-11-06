var express = require('express');
	http = require('http'),
	path = require('path'),
	createError = require('http-errors'),
	cookieParser = require('cookie-parser'),
	socketIO = require('socket.io'),
	logger = require('morgan')
	cote = require('cote'),
	cookieParserIO = require('socket.io-cookie');;

var router = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', router);

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

var server = http.createServer(app),
	io = socketIO(server);

io.use(cookieParserIO);
//io.use(authorization);

// Starts the server.
server.listen(3000, function() {
  console.log('Starting server on port 3000');
});

/* io.on('connection', function(socket){
	const username = socket.request.headers.cookie.username
	console.log(username + ' connected');
	socket.on('disconnect', function(){
		console.log(username + ' disconnected');
	});
}); */

io.on('connection', (socket) => {
	socket.on('registration', (msg) => {
		var roomIndex = -1;
		for(var i = 0; i < router.use.rooms.length; i++) {
			if (router.use.rooms[i].name === msg.roomName) {
				roomIndex = i;
				break;
			}
		}
		if (roomIndex === -1) {
			io.to(socket.id).emit('registration', 'Wrong room name!');
		} else {
			if (router.use.rooms[roomIndex].players.length > router.use.players_limit) {
				io.to(socket.id).emit('registration', 'Too much players in this room!');
			} else {
				var isUsernameUnique = true;
				for (var i = 0; i < router.use.rooms[roomIndex].players.length; i++){
					if (router.use.rooms[roomIndex].players[i].username === msg.username){
						isUsernameUnique = false;
						break;
					}
				}
				if (!isUsernameUnique){
					io.to(socket.id).emit('registration', 'There is already exist a player with this name in the room!');
				} else {
					router.use.rooms[roomIndex].players.push({username: msg.username, id: socket.id});
					console.log('Player ' + msg.username + ' connected to the room ' + msg.roomName);
					io.to(socket.id).emit('registration', 'ok');
				}
			}
		}
		socket.on('disconnect', () => {
			var roomIndex = -1;
			for(var i = 0; i < router.use.rooms.length; i++) {
				if (router.use.rooms[i].name === msg.roomName) {
					roomIndex = i;
					break;
				}
			}
			if (roomIndex != -1) {
				for (var i = 0; i < router.use.rooms[roomIndex].players.length; i++){
					if (socket.id === router.use.rooms[roomIndex].players[i].id){
						console.log('Player ' + router.use.rooms[roomIndex].players[i].username + ' disconnected from the room ' + router.use.rooms[roomIndex].name);
						router.use.rooms[roomIndex].players.splice(i, 1);
					}
				}
			}
		});
	});
});