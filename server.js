'use strict'

var express = require('express'),
	http = require('http'),
	path = require('path'),
	createError = require('http-errors'),
	cookieParser = require('cookie-parser'),
	socketIO = require('socket.io'),
	logger = require('morgan'),
	cookieParserIO = require('socket.io-cookie'),
	amqp = require('amqplib/callback_api'),
	child_process = require('child_process');

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

var server = http.createServer(app),
	io = socketIO(server);

io.use(cookieParserIO);

// Starts the server.
server.listen(3000, function() {
  console.log('Starting server on port 3000');
});

io.on('connection', (socket) => {
	socket.on('registration', async (msg) => {
		try {
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
					for (var i = 0; i < router.use.rooms[roomIndex].players.length; i++) {
						if (router.use.rooms[roomIndex].players[i].username === msg.username) {
							isUsernameUnique = false;
							break;
						}
					}
					if (!isUsernameUnique){
						io.to(socket.id).emit('registration', 'There is already exist a player with this name in the room!');
					} else {
						router.use.rooms[roomIndex].players.push({username: msg.username, id: socket.id});
						const ch = await router.use.channel;
						const message = new router.use.Message({body: 'Player ' + msg.username + ' connected to the room', room: msg.roomName});
						ch.assertQueue('chat/' + msg.roomName, {durable: false});
						ch.sendToQueue('chat/' + msg.roomName, Buffer.from(JSON.stringify(message)));
						console.log('Player ' + msg.username + ' connected to the room ' + msg.roomName);
						io.to(socket.id).emit('registration', 'ok');
						socket.on('disconnect', () => {
							for (var i = 0; i < router.use.rooms[roomIndex].players.length; i++){
								if (socket.id === router.use.rooms[roomIndex].players[i].id) {
									console.log('Player ' + router.use.rooms[roomIndex].players[i].username + ' disconnected from the room ' + router.use.rooms[roomIndex].name);
									const message = new router.use.Message({body: 'Player ' + msg.username + ' disconnected from the room', room: msg.roomName});
									ch.assertQueue('chat/' + msg.roomName, {durable: false});
									ch.sendToQueue('chat/' + msg.roomName, Buffer.from(JSON.stringify(message)));
									router.use.rooms[roomIndex].players.splice(i, 1);
								}
							}
						});
					}
				}
			}
		} catch (err) {
			console.log(err);
		}
	});
});

/* console.log("something: " + process.argv[0]);

const child = child_process.spawn(process.argv[0], ['chatRoom.js', 'something'], {
	detached: true,
	shell: true
});


child.on('exit', function (code, signal) {
	console.log('child process exited');
});

amqp.connect('amqp://localhost', (err, conn) => {
	conn.createChannel((err, ch) => {
		var q = 'something';
		var msg = 'Hello World!';
		
		ch.assertQueue(q, {durable: false});
		ch.sendToQueue(q, Buffer.from(msg));
	});
}); */