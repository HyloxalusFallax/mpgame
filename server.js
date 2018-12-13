'use strict'

const express = require('express'),
	  http = require('http'),
	  path = require('path'),
	  createError = require('http-errors'),
	  cookieParser = require('cookie-parser'),
	  socketIO = require('socket.io'),
	  logger = require('morgan'),
	  cookieParserIO = require('socket.io-cookie'),
	  amqp = require('amqplib'),
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
				if (router.use.rooms[roomIndex].players.length >= router.use.players_limit) {
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
						var message = {command: 'fetch chat', client: socket.id, room: router.use.rooms[roomIndex].name};
						console.log('fetching chat');
						ch.assertQueue('chat/' + msg.roomName, {durable: false});
						ch.sendToQueue('chat/' + msg.roomName, Buffer.from(JSON.stringify(message)));
						message = new router.use.Message({body: 'Player ' + msg.username + ' connected to the room', room: msg.roomName});
						ch.assertQueue('chat/' + msg.roomName, {durable: false});
						ch.sendToQueue('chat/' + msg.roomName, Buffer.from(JSON.stringify({message: message, command: 'post message'})));
						console.log('Player ' + msg.username + ' connected to the room ' + msg.roomName);
						ch.assertQueue('game/' + msg.roomName, {durable: false});
						ch.sendToQueue('game/' + msg.roomName, Buffer.from(JSON.stringify({id: socket.id, username: msg.username, command: 'spawn player'})));
						socket.join(msg.roomName);
						socket.on('disconnect', () => {
							if (router.use.rooms[roomIndex] != null) {
								for (var i = 0; i < router.use.rooms[roomIndex].players.length; i++) {
									if (socket.id === router.use.rooms[roomIndex].players[i].id) {
										console.log('Player ' + router.use.rooms[roomIndex].players[i].username + ' disconnected from the room ' + router.use.rooms[roomIndex].name);
										const message = new router.use.Message({body: 'Player ' + msg.username + ' disconnected from the room', room: msg.roomName});
										ch.assertQueue('chat/' + msg.roomName, {durable: false});
										ch.sendToQueue('chat/' + msg.roomName, Buffer.from(JSON.stringify({message: message, command: 'post message'})));
										ch.assertQueue('game/' + msg.roomName, {durable: false});
										ch.sendToQueue('game/' + msg.roomName, Buffer.from(JSON.stringify({id: socket.id, command: 'despawn player'})));
										router.use.rooms[roomIndex].players.splice(i, 1);
										break;
									}
								}
							}
						});
						socket.on('post message', async (msg) => {
							var roomIndex = -1;
							for(var i = 0; i < router.use.rooms.length; i++) {

								if (router.use.rooms[i].name === msg.room) {
									roomIndex = i;
									break;
								}
							}
							if (roomIndex === -1) {
								io.to(socket.id).emit('post message', 'Wrong room name!');
							} else {
								var playerIndex = -1;
								for (var i = 0; i < router.use.rooms[roomIndex].players.length; i++) {
									if (socket.id === router.use.rooms[roomIndex].players[i].id) {
										playerIndex = i;
										break;
									}
								}
								if (playerIndex === -1) {
									console.log('Wrong player name!');
									io.to(socket.id).emit('post message', 'Wrong player name!');
								} else {
									const ch = await router.use.channel;
									const message = new router.use.Message({author: msg.author, room: msg.room, body: msg.body, date: msg.date});
									ch.assertQueue('chat/' + msg.room, {durable: false});
									ch.sendToQueue('chat/' + msg.room, Buffer.from(JSON.stringify({message: message, command: 'post message'})));
								}
							}
						});
						socket.on('controls update', async (msg) => {
							//console.log('controls update');
							var roomIndex = -1;
							for(var i = 0; i < router.use.rooms.length; i++) {

								if (router.use.rooms[i].name === msg.room) {
									roomIndex = i;
									break;
								}
							}
							if (roomIndex === -1) {
								io.to(socket.id).emit('controls update', 'Wrong room name!');
							} else {
								var playerIndex = -1;
								for (var i = 0; i < router.use.rooms[roomIndex].players.length; i++) {
									if (socket.id === router.use.rooms[roomIndex].players[i].id) {
										playerIndex = i;
										break;
									}
								}
								if (playerIndex === -1) {
									console.log('Wrong player name!');
									io.to(socket.id).emit('post message', 'Wrong player name!');
								} else {
									const ch = await router.use.channel;
									ch.assertQueue('game/' + msg.room, {durable: false});
									ch.sendToQueue('game/' + msg.room, Buffer.from(JSON.stringify({controls: msg.controls, id: socket.id, command: 'controls update'})));
								}
							}
						});
						io.to(socket.id).emit('registration', 'ok');
					}
				}
			}
		} catch (err) {
			console.log(err);
		}
	});
});

async function monitorMessages() {
	try {
		const ch = await router.use.channel;
		await ch.assertQueue('mainServer', {durable: false});
		await ch.consume('mainServer', processMessage, {noAck: true, exclusive: true});
	} catch(err) {
		console.log(err);
	}
}
	
async function processMessage(msg) {
	try {
		const data = JSON.parse(msg.content);
		switch (data.command) {
			case 'post message':
				console.log('posting message');
				io.to(data.message.room).emit('post message', data.message);
				break;
			case 'fetched chat':
				console.log('fetched chat');
				io.to(data.client).emit('fetched chat', data.result);
				break;
			case 'game update':
				io.to(data.room).emit('game update', {players: data.players, walls: data.walls, bullets: data.bullets, explosions: data.explosions});
				break;
		}
	} catch(err) {
		console.log(err);
	}
}

monitorMessages();