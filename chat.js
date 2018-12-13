'use strict'

const amqp = require('amqplib'),
	  moment = require('moment');

const roomName = process.argv[2];

var conn, channel, ch;

class Message {
	constructor({author = null, body = '', date = new Date(), room = null}) {
		this.author = author;
		this.body = body;
		this.date = date;
		this.room = room;
	}
}

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
	try {
		const data = JSON.parse(msg.content);
		ch = await channel;
		switch(data.command) {
			case ('post message'):
				const date = new moment(data.message.date);
				if (data.message.author != null)
					console.log(date.format('HH:mm:ss') + ' ' + data.message.author + ': ' + data.message.body);
				else
					console.log(date.format('HH:mm:ss') + ': ' + data.message.body);
				var dbData = {message: new Message({author: data.message.author, date: data.message.date, body: data.message.body, room: data.message.room}), command: 'save message'};
				await ch.assertQueue('db', {durable: false});
				await ch.sendToQueue('db', Buffer.from(JSON.stringify(dbData)));
				const serverData = {message: new Message({author: data.message.author, date: data.message.date, body: data.message.body, room: data.message.room}), command: 'post message'};
				await ch.assertQueue('mainServer', {durable: false});
				await ch.sendToQueue('mainServer', Buffer.from(JSON.stringify(serverData)));
				break;
			case ('fetch chat'):
				console.log('fetching chat');
				await ch.assertQueue('db', {durable: false});
				await ch.sendToQueue('db', Buffer.from(JSON.stringify({room: roomName, command: 'fetch chat', client: data.client})));
				break;
			case ('fetched chat'):
				console.log('fetched chat');
				await ch.assertQueue('mainServer', {durable: false});
				await ch.sendToQueue('mainServer', Buffer.from(JSON.stringify(data)));
				break;
			case ('stop'):
				console.log('closing');
				await ch.assertQueue('db', {durable: false});
				await ch.sendToQueue('db', Buffer.from(JSON.stringify({room: roomName, command: 'delete room'})));
				await ch.deleteQueue('chat/' + roomName);
				await ch.close();
				await conn.close();
				process.exit(0);
				break;
		}
	} catch (err) {
		console.log(err);
	}
}

main();