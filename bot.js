'use strict'

const amqp = require('amqplib');

var conn, channel, ch;

const roomName = process.argv[2];
const botName = process.argv[3];

var controls;

var players = [];

async function main() {
	try {
		console.log('starting the bot');
		conn = await amqp.connect('amqp://localhost');
		channel = await conn.createChannel();
		await channel.assertQueue('game/' + roomName, {durable: false});
		await channel.sendToQueue('game/' + roomName, Buffer.from(JSON.stringify({username: botName, id: botName, command: 'spawn player'})));
		await channel.assertQueue('game/' + roomName + '/bots/' + botName, {durable: false});
		await channel.consume('game/' + roomName + '/bots/' + botName, processMessage, {noAck: true, exclusive: true});
	} catch (err) {
		console.log(err);
	}
};


async function processMessage(msg) {
	try {
		ch = await channel;
		const data = JSON.parse(msg.content);
		switch (data.command) {
			case 'game update':
				players = data.players;
				botCycle();
				break;
			case 'stop':
				console.log('stopping the bot');
				ch.assertQueue('game/' + roomName, {durable: false});
				ch.sendToQueue('game/' + roomName, Buffer.from(JSON.stringify({id: botName, command: 'despawn player'})));
				await ch.close();
				await conn.close();
				process.exit(0);
				break;
		}
	} catch (err) {
		console.log(err);
	}
}

async function botCycle(){
	try {
		ch = await channel;
		//ch.assertQueue('game/' + roomName, {durable: false});
		//ch.sendToQueue('game/' + roomName, Buffer.from(JSON.stringify({controls: controls, id: botName, command: 'controls update'})));
	} catch (err) {
		console.log(err);
	}
}

main();