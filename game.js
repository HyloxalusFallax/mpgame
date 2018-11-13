'use strict'

const amqp = require('amqplib');

const roomName = process.argv[2];

var conn, channel, ch, cycleNumber = 0;

const mapXSize = 1200;
const mapYSize = 900;
const playerSize = 30;
const speed = 5;
var players = [];

class Player {
	constructor({score = 0, x = 10, y = 10, id, username}){
		this.id = id;
		this.username = username;
		this.score = score;
		this.x = x;
		this.y = y;
		this.movement = '';
		this.isRunning = false;
	}
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

function gameCycle() {
	try {
		//ch = await channel;
		//cycleNumber++;
		// if (cycleNumber % 100 === 0) {
			// console.log(players);
			// console.log('cycle number: ' + cycleNumber);
		// }			
		for (var i = 0; i < players.length; i++){
			if (players[i].isRunning) {
				switch (players[i].movement) {
					case 'left':
						players[i].x -= speed;
						break;
					case 'up':
						players[i].y -= speed;
						break;
					case 'right':
						players[i].x += speed;
						break;
					case 'down':
						players[i].y += speed;
						break;
				}
			}
		}
		channel.assertQueue('mainServer', {durable: false});
		channel.sendToQueue('mainServer', Buffer.from(JSON.stringify({players: players, room: roomName, command: 'game update'})));
		setTimeout(gameCycle, 30);
	} catch (err) {
		console.log(err);
	}
}

main();
setTimeout(gameCycle, 1000);