'use strict'

const amqp = require('amqplib');

const roomName = process.argv[2];

var conn, channel, ch, cycleNumber = 0;

const mapXSize = 1200;
const mapYSize = 900;
const playerSize = 30;
const speed = 15;
var players = [];
var walls = [];

walls.push({x1: -50, y1: -50, x2: 5, y2: 950});
walls.push({x1: 1195, y1: -50, x2: 1250, y2: 950});
walls.push({x1: -50, y1: -50, x2: 1250, y2: 5});
walls.push({x1: -50, y1: 895, x2: 1250, y2: 950});

class Player {
	constructor({score = 0, x = 100, y = 100, id, username}){
		this.id = id;
		this.username = username;
		this.score = score;
		this.x = x;
		this.y = y;
		this.movement = '';
		this.isRunning = false;
	}
	/* get x2(){
		return x + playerSize;
	}
	get y2(){
		return y + playerSize;
	} */
}

async function main() {
	try {
		console.log('starting game session');
		conn = await amqp.connect('amqp://localhost');
		channel = await conn.createChannel();
		await channel.assertQueue('game/' + roomName, {durable: false});
		await channel.consume('game/' + roomName, processMessage, {noAck: true, exclusive: true});
	} catch (err) {
		console.log(err);
	}
};

async function processMessage(msg) {
	try {
		ch = await channel;
		const data = JSON.parse(msg.content);
		switch (data.command) {
			case 'spawn player':
				console.log('spawn player');
				players.push(new Player({id: data.id, username: data.username}));
				break;
			case 'despawn player':
				console.log('despawn player');
				for (var i = 0; i < players.length; i++)
					if (data.id === players[i].id){
						players.splice(i, 1);
						break;
					}
				break;
			case 'controls update':
				//console.log('controls update');
				for (var i = 0; i < players.length; i++)
					if (data.id === players[i].id) {
						switch (data.movement) {
							case 'left':
							case 'up':
							case 'right':
							case 'down':
								players[i].movement = data.movement;
								players[i].isRunning = true;
								break;
							case '':
								players[i].movement = data.movement;
								players[i].isRunning = false;
								break;
						}
						break;
					}
				break;
			case 'stop':
				console.log('stopping the game');
				await ch.close();
				await conn.close();
				process.exit(0);
				break;
		}
	} catch (err) {
		console.log(err);
	}
}

function movePlayer(i, speed){
	var newX = players[i].x, newY = players[i].y;
	switch (players[i].movement) {
		case 'left':
			newX -= speed;
			break;
		case 'up':
			newY -= speed;
			break;
		case 'right':
			newX += speed;
			break;
		case 'down':
			newY += speed;
			break;
	}
	if (!isOverlappingWithAWall(newX, newY, newX + playerSize, newY + playerSize) && !isOvelappingWithOtherPlayers(newX, newY, i)){
		players[i].x = newX;
		players[i].y = newY;
		return true;
	} else {
		return false;
	}
}

function gameCycle() {
	try {
		for (var i = 0; i < players.length; i++){
			if (players[i].isRunning) {
				var newSpeed = speed;
				while((!movePlayer(i, newSpeed)) && (newSpeed >= 1)){
					newSpeed = Math.floor(newSpeed/2);
				}
				//console.log('Stop Right There, Criminal Scum!'
			}
		}
		channel.assertQueue('mainServer', {durable: false});
		channel.sendToQueue('mainServer', Buffer.from(JSON.stringify({players: players, walls: walls, room: roomName, command: 'game update'})));
		setTimeout(gameCycle, 30);
	} catch (err) {
		console.log(err);
	}
}

function isOverlappingWithAWall(x1, y1, x2, y2){
	for (var i = 0; i < walls.length; i++){
		if (isOverlapped(x1, y1, x2, y2, walls[i].x1, walls[i].y1, walls[i].x2, walls[i].y2))
			return true;
	}
	return false;
}

function isOvelappingWithOtherPlayers(x, y, index){
	for(var i = 0; i < players.length; i++){
		if (i === index)
			continue;
		if (isPlayersOverlapped(x, y, players[i].x, players[i].y))
			return true;
	}
	return false;
}

function isPlayersOverlapped(firstX, firstY, secondX, secondY){
	return isOverlapped(firstX, firstY, firstX + playerSize, firstY + playerSize, secondX, secondY, secondX + playerSize, secondY + playerSize);
}

function isOverlapped(firstX1, firstY1, firstX2, firstY2, secondX1, secondY1, secondX2, secondY2){
	return ((firstX2 >= secondX1) && (firstY1 <= secondY2) && (firstY2 >= secondY1) && (firstX1 <= secondX2));
}

main();
setTimeout(gameCycle, 1000);