'use strict'

const amqp = require('amqplib');

var conn, channel, ch;

const roomName = process.argv[2];
const botName = process.argv[3];

var controls = '';

var players = [];

const shootingDistance = 1000,
	  playerLength = 60,
	  playerWidth = 30,
	  bulletSize = 10;

var course = 1;
	  
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
				await ch.close();
				await conn.close();
				process.exit(0);
				break;
		}
	} catch (err) {
		console.log(err);
	}
}

async function botCycle() {
	try {
		ch = await channel;
		var self;
		var selfIndex;
		for (var i = 0; i < players.length; i++)
			if (players[i].username === botName){
				self = players[i];
				selfIndex = i;
			}
		var closestOtherPlayer,
			closestPlayerCenterX,
			closestPlayerCenterY,
			closestDistance = 10000;
		const selfCenterX = self.x1 + (self.x2 - self.x1) / 2,
			  selfCenterY = self.y1 + (self.y2 - self.y1) / 2;
		for (var i = 0; i < players.length; i++){
			if (players[i].username != botName){
				const playerCenterX = players[i].x1 + (players[i].x2 - players[i].x1) / 2,
					  playerCenterY = players[i].y1 + (players[i].y2 - players[i].y1) / 2;
				const distanceToPlayer = distance(selfCenterX, selfCenterY, playerCenterX, playerCenterY);
				if (distanceToPlayer < closestDistance){
					closestDistance = distanceToPlayer;
					closestOtherPlayer = players[i];
					closestPlayerCenterX = playerCenterX;
					closestPlayerCenterY = playerCenterY;
				}
			}
		}
		var shootingRange = {};
		switch (self.direction) {
			case 'up':
				shootingRange.x1 = self.x1 + playerWidth/2 - bulletSize/2;
				shootingRange.y1 = self.y1 - shootingDistance;
				shootingRange.x2 = self.x1 + playerWidth/2 + bulletSize/2;
				shootingRange.y2 = self.y1;
				break;
			case 'right':
				shootingRange.x1 = self.x2;
				shootingRange.y1 = self.y1 + playerWidth/2 - bulletSize/2;
				shootingRange.x2 = self.x2 + shootingDistance;
				shootingRange.y2 = self.y1 + playerWidth/2 + bulletSize/2;
				break;
			case 'down':
				shootingRange.x1 = self.x1 + playerWidth/2 - bulletSize/2;
				shootingRange.y1 = self.y2;
				shootingRange.x2 = self.x1 + playerWidth/2 + bulletSize/2;
				shootingRange.y2 = self.y2 + shootingDistance;
				break;
			case 'left':
				shootingRange.x1 = self.x1 - shootingDistance;
				shootingRange.y1 = self.y1 + playerWidth/2 - bulletSize/2;
				shootingRange.x2 = self.x1;
				shootingRange.y2 = self.y1 + playerWidth/2 + bulletSize/2;
				break;
		}
		if (isOvelappingWithOtherPlayers(shootingRange.x1, shootingRange.y1, shootingRange.x2, shootingRange.y2, selfIndex))
			controls = 'fire';
		else {
			if (course === 1) {
				if (selfCenterX < closestPlayerCenterX - playerWidth/2)
					controls = 'right';
				else if (selfCenterX > closestPlayerCenterX + playerWidth/2)
					controls = 'left';
				else if (selfCenterY < closestPlayerCenterY - playerWidth/2)
					controls = 'down';
				else if (selfCenterY > closestPlayerCenterY + playerWidth/2)
					controls = 'up';
			} else {
				if (selfCenterY > closestPlayerCenterY + playerWidth/2)
					controls = 'up';
				else if (selfCenterY < closestPlayerCenterY  - playerWidth/2)
					controls = 'down';
				else if (selfCenterX < closestPlayerCenterX - playerWidth/2)
					controls = 'right';
				else if (selfCenterX > closestPlayerCenterX + playerWidth/2)
					controls = 'left';
			}
			if (closestDistance < 100){
				/* console.log('distance ' + closestDistance);
				console.log('controls: ' + controls);
				console.log('rnd: ' + getRndInteger(1, 10)); */
				if(getRndInteger(1, 10) === 1){
					if (controls === 'up')
						controls = 'left';
					else if (controls === 'down')
						controls = 'right';
					else if (controls === 'right')
						controls = 'up';
					else if (controls === 'left')
						controls = 'down';
				/* console.log('new controls: ' + controls); */
				}
			}
		}
		if (getRndInteger(1, 100) === 1){
			console.log('change course');
			course = course * -1;
		}
		/* switch (getRndInteger(1, 100)){
			case 1:
				controls = 'up';
				break;
			case 2:
				controls = 'right';
				break;
			case 3:
				controls = 'left';
				break;
			case 4:
				controls = 'down';
				break;
		} */
		ch.assertQueue('game/' + roomName, {durable: false});
		ch.sendToQueue('game/' + roomName, Buffer.from(JSON.stringify({controls: controls, id: botName, command: 'controls update'})));
	} catch (err) {
		console.log(err);
	}
}

function distance (x, y, sx, sy){
	return Math.sqrt(Math.pow((x - sx), 2) + Math.pow((y - sy), 2));
}

function isOverlapped(firstX1, firstY1, firstX2, firstY2, secondX1, secondY1, secondX2, secondY2){
	return ((firstX2 >= secondX1) && (firstY1 <= secondY2) && (firstY2 >= secondY1) && (firstX1 <= secondX2));
}

function isPlayersOverlapped(firstX1, firstY1, firstX2, firstY2, secondX1, secondY1, secondX2, secondY2){
	return isOverlapped(firstX1, firstY1, firstX2, firstY2, secondX1, secondY1, secondX2, secondY2);
}

function isOvelappingWithOtherPlayers(x1, y1, x2, y2, index){
	for(var i = 0; i < players.length; i++){
		if (i === index)
			continue;
		if (isPlayersOverlapped(x1, y1, x2, y2, players[i].x1, players[i].y1, players[i].x2, players[i].y2))
			return true;
	}
	return false;
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

main();