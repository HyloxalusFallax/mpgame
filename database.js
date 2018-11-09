'use strict'

const mongoose = require('mongoose'),
	  amqp = require('amqplib');

mongoose.connect('mongodb://localhost/mpgame', {useNewUrlParser: true});

var conn, channel, ch;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('connected to database')
});

const messagesSchema = new mongoose.Schema({
	author: String,
	room: String,
	body: String,
	date: Date
});

const Message = mongoose.model('Message', messagesSchema);

async function main() {
	try {
		console.log('starting');
		conn = await amqp.connect('amqp://localhost');
		channel = await conn.createChannel();
		await channel.assertQueue('db', {durable: false});
		await channel.consume('db', processMessage, {noAck: true, exclusive: true});
	} catch (err) {
		console.log(err);
	}
};

async function processMessage(msg) {
	try {
		const data = JSON.parse(msg.content);
		switch (data.command) {
			case 'save message':
				console.log('saving message');
				const date = new Date(data.message.date);
				const newMessage = new Message({author: data.message.author, room: data.message.room, body: data.message.body, date: date});
				await newMessage.save();
				break;
			case 'delete room':
				console.log('deleting chat room');
				await Message.deleteMany({room: data.room});
				break;
			case 'fetch chat':
				console.log('fetching chat');
				const result = await Message.find({room: data.room});
				var safeResult = [];
				for (var i = 0; i < result.length; i++)
					safeResult.push({author: result[i].author, room: result[i].room, body: result[i].body, date: result[i].date});
				ch = await channel;
				await ch.assertQueue('chat/' + data.room, {durable: false});
				await ch.sendToQueue('chat/' + data.room, Buffer.from(JSON.stringify({result: safeResult, client: data.client, command: 'fetched chat'})));
				break;
			case 'stop':
				console.log('closing');
				await channel.close();
				await conn.close();
				process.exit(0);
				break;
		}
	} catch (err) {
		console.log(err);
	}
}

main();