'use strict'

const amqp = require('amqplib'),
	  moment = require('moment');

const roomName = process.argv[2];

var conn, channel;

async function main() {
	try {
		console.log('starting');
		conn = await amqp.connect('amqp://localhost');
		channel = await conn.createChannel();
		await channel.assertQueue('chat/' + roomName, {durable: false});
		await channel.consume('chat/' + roomName, processMessage, {noAck: true, exclusive: true});
	} catch (err) {
		console.log(err);
	}
};

async function processMessage(msg) {
	const data = JSON.parse(msg.content);
	const date = new moment(data.date);
	if (data.command === 'post message') {
		if (data.author != null)
			console.log(date.format('HH:mm:ss') + ' ' + data.author + ': ' + data.body);
		else
			console.log(date.format('HH:mm:ss') + ': ' + data.body);
		const ch = await channel;
		const dbData = {author: data.author, date: data.date, body: data.body, room: data.room, command: 'save message'};
		await ch.assertQueue('db', {durable: false});
		await ch.sendToQueue('db', Buffer.from(JSON.stringify(dbData)));
		const serverData = {author: data.author, date: data.date, body: data.body, room: data.room, command: 'post message'};
		await ch.assertQueue('mainServer', {durable: false});
		await ch.sendToQueue('mainServer', Buffer.from(JSON.stringify(serverData)));
	} else if (data.command === 'stop') {
		console.log('closing');
		const ch = await channel;
		const dbData = {room: roomName, command: 'delete room'};
		await ch.assertQueue('db', {durable: false});
		await ch.sendToQueue('db', Buffer.from(JSON.stringify(dbData)));
		await channel.close();
		await conn.close();
		process.exit(0);
	}
}

main();