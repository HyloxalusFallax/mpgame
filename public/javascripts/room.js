'use strict';

var socket = io();
const roomName = window.location.pathname.split('/')[2];
var username = '';
var allMessages = [];
var players = [];
var walls = [];
var bullets = [];
var explosions = [];

$("#chatForm").submit(event => {
	event.preventDefault();
});

$("#chatForm").submit(submitMessage);

const usernameForm = $('<form></form>');
usernameForm.attr('id', 'usernameForm');
usernameForm.attr('class', 'modal');
const usernameInput = $('<input></input>')
usernameInput.attr('id', 'usernameInput');
usernameInput.attr('type', 'text');
usernameInput.attr('placeholder', 'Username');
const usernameButton = $('<button></button>');
usernameButton.attr('id', 'usernameSubmit')
usernameButton.attr('type', 'submit');
usernameButton.text('Connect');
usernameButton.click(connectToARoomWithUsername(roomName));
usernameForm.append(usernameInput, usernameButton);
usernameForm.modal({
	escapeClose: false,
	clickClose: false,
	showClose: false
});

function connectToARoomWithUsername(roomName) {
	return function(event){
		event.preventDefault();
		username = $('#usernameInput').val();
		socket.emit('registration', {roomName: roomName, username: username});
	}
}

function submitMessage() {
	const message = {author: username, room: roomName, body: $('#messageInput').val(), date: new Date()};
	$('#messageInput').val('');
	socket.emit('post message', message);
}

socket.on('registration', (msg) => {
	if (msg === 'ok') {
		$.modal.close();
		socket.on('fetched chat', (chat) => {
			allMessages = allMessages.concat(chat);
			fillChat();
		});
	} else {
		
	}
});

socket.on('post message', (msg) => {
	console.log(allMessages.length);
	//if (allMessages.length > 100)
	//	allMessages.splice(0, 10);
	allMessages.push(msg);
	fillChat();
});

function fillChat() {
	$('#chatbox').empty();
	allMessages.sort((a, b) => {
		return new Date(a.date) > new Date(b.date);
	});
	for (var i = 0; i < allMessages.length; i++)
		addMessage(allMessages[i]);
	$('#chatbox').scrollTop($('#chatbox').height()*$('#chatbox').height());
}

function addMessage(msg){
	const time = new moment(msg.date).format("HH:mm:ss");
	const message = $('<div></div>');
	message.attr('class', 'message');
	const timestamp = $('<div></div>').attr('class', 'timestamp').text(time);
	const author = $('<div></div>').attr('class', 'author').text(msg.author);
	const body = $('<div></div>').attr('class', 'messageBody').text(msg.body);
	if (msg.author != null){
		message.append(author, $('<div></div>').text(':').attr('class', 'divider'), body, timestamp);
	}
	else
		message.append(body, timestamp);
	$('#chatbox').append(message);
}

const playerLength = 60;
const playerWidth = 30;
const cannonLength = playerLength * 1/3;
const cannonWidth = playerWidth * 1/4;
const bulletSize = 10;
const explosionSize = 100;

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 900;
console.log($('#canvas').width());
console.log($('#canvas').height());
console.log(canvas.width + ';' + canvas.height);
socket.on('game update', function(data) {
	players = data.players;
	walls = data.walls;
	bullets = data.bullets;
	console.log(data.explosions)
	explosions = data.explosions;
	update();
});

function fillLeaderboard(){
	//players.sort((a, b) => {
	//	return a.score < b.score;
	//});
	$('#leaderboard').empty();
	for (var i = 0; i < players.length; i++)
		addLeaderboardEntry(players[i]);
}

function addLeaderboardEntry(player){
	const entry = $('<div></div>').attr('class', 'entry');
	const score = $('<div></div>').attr('class', 'score').text(player.score);
	const username = $('<div></div>').attr('class', 'author').text(player.username);
	entry.append(username, $('<div></div>').text(':').attr('class', 'divider'), score);
	$('#leaderboard').append(entry);
}

function fillStats(){
	var playerIndex = -1;
	for (var i = 0; i < players.length; i++)
		if (username === players[i].username)
			playerIndex = i;
	$('#stats').empty();
	const stat1 = $('<div></div>').attr('class', 'entry');
	const stat2 = $('<div></div>').attr('class', 'entry');
	const cannon = $('<div></div>').text('cannon');
	var reload = $('<div></div>');
	const shield = $('<div></div>').text('shield');
	var cooldown = $('<div></div>');
	if(playerIndex !== -1)
		if (players[playerIndex].reload != '0')
			reload.attr('style', 'color: red').text('reloading (' + players[playerIndex].reload + ')');
		else
			reload.attr('style', 'color: green').text('ready');
		if (players[playerIndex].cooldown != '0')
			cooldown.attr('style', 'color: red').text('cooldown (' + players[playerIndex].cooldown + ')');
		else
			cooldown.attr('style', 'color: green').text('ready');
	stat1.append(cannon, $('<div></div>').text(':').attr('class', 'divider'), reload);
	stat2.append(shield, $('<div></div>').text(':').attr('class', 'divider'), cooldown);
	$('#stats').append(stat1);
	$('#stats').append(stat2);

}

function update(){
	fillLeaderboard();
	fillStats();
	context.fillStyle = "#101010";
	context.fillRect(0,0,canvas.width,canvas.height);
	context.fillStyle = "#660000";
	for (var i = 0; i < bullets.length; i++) {
		context.beginPath();
		context.arc(bullets[i].x, bullets[i].y, bulletSize/2, 0, 2 * Math.PI, false);
		context.fill();
	}
	for (var i = 0; i < players.length; i++) {
		if (players[i].username != username)
			context.fillStyle = "silver";
		else
			context.fillStyle = "gold";
		context.textAlign = "center";
		context.font = "15px Arial";
		var colorHealth = "green"
		if (players[i].health > 66)
			colorHealth = "green"
		else if (players[i].health > 33 & players[i].health <= 66)
			colorHealth = "yellow"
		else if (players[i].health <= 33)
			colorHealth = "red"
		if ((players[i].direction === 'up') || (players[i].direction === 'down')){
			context.fillText(players[i].username, players[i].x1 + playerWidth/2 , players[i].y1 - 25);
			context.fillStyle = colorHealth;
			context.fillRect(players[i].x1 + playerWidth/2 - playerLength/2, players[i].y1 - 17, playerLength * (players[i].health/100), 12);
			context.fillStyle = "silver";
			context.fillText(players[i].health, players[i].x1 + playerWidth/2 , players[i].y1 - 5);
		}
		else if (players[i].direction === 'right'){
			context.fillText(players[i].username, players[i].x1 + playerLength/2 - cannonLength/2, players[i].y1 - 25);
			context.fillStyle = colorHealth;
			context.fillRect(players[i].x1 - cannonLength/2, players[i].y1 - 17, playerLength * (players[i].health/100), 12);
			context.fillStyle = "silver";
			context.fillText(players[i].health,  players[i].x1 + playerLength/2 - cannonLength/2,  players[i].y1 - 5);
		}
		else if (players[i].direction === 'left'){
			context.fillText(players[i].username, players[i].x1 + playerLength/2 + cannonLength/2, players[i].y1 - 25);
			context.fillStyle = colorHealth;
			context.fillRect(players[i].x1 + cannonLength/2, players[i].y1 - 17, playerLength * (players[i].health/100), 12);
			context.fillStyle = "silver";
			context.fillText(players[i].health, players[i].x1 + playerLength/2 + cannonLength/2, players[i].y1 - 5);
		}
		if (players[i].shielded == true)
			context.fillStyle = "Blue"
		else
			context.fillStyle = "#223709";
		switch (players[i].direction){
			case 'up':
				context.fillRect(players[i].x1, players[i].y1 + cannonLength, playerWidth, playerLength - cannonLength);
				context.fillRect(players[i].x1 + playerWidth/2 - cannonWidth/2, players[i].y1, cannonWidth, cannonLength);
				break;
			case 'right':
				context.fillRect(players[i].x1, players[i].y1, playerLength-cannonLength, playerWidth);
				context.fillRect(players[i].x2 - cannonLength, players[i].y1 + playerWidth/2 - cannonWidth/2, cannonLength, cannonWidth);
				break;
			case 'down':
				context.fillRect(players[i].x1, players[i].y1, playerWidth, playerLength - cannonLength);
				context.fillRect(players[i].x1 + playerWidth/2 - cannonWidth/2, players[i].y2-cannonLength, cannonWidth, cannonLength);
				break;
			case 'left':
				context.fillRect(players[i].x1 + cannonLength, players[i].y1, playerLength - cannonLength, playerWidth);
				context.fillRect(players[i].x1, players[i].y1 + playerWidth/2 - cannonWidth/2, cannonLength, cannonWidth);
				break;
		}
	}
	for (var i = 0; i < explosions.length; i++){
		context.fillStyle = 'rgba(255, 255, 0, ' + explosions[i].remaining/10 + ')';
		context.beginPath();
		context.arc(explosions[i].x, explosions[i].y, explosionSize/2, 0, 2 * Math.PI, false);
		context.fill();
	}
	context.fillStyle = "#745907";
	for (var i = 0; i < walls.length; i++) {
		context.fillRect(walls[i].x1, walls[i].y1, walls[i].x2-walls[i].x1, walls[i].y2-walls[i].y1);
	}
}

$('#messageInput').focus(() =>{
	socket.emit('controls update', {controls: '', room: roomName});
});

$(document).focusout(() => {
	socket.emit('controls update', {controls: '', room: roomName});
});

var controls = '';

$(document).keydown((event) => {
	if($(':focus').length)
		return;
	switch (event.keyCode) {
		case 65: // A
			controls = 'left';
			socket.emit('controls update', {controls: controls, room: roomName});
			break;
		case 87: // W
			controls = 'up';
			socket.emit('controls update', {controls: controls, room: roomName});
			break;
		case 68: // D
			controls = 'right';
			socket.emit('controls update', {controls: controls, room: roomName});
			break;
		case 83: // S
			controls = 'down';
			socket.emit('controls update', {controls: controls, room: roomName});
			break;
		case 32: // SPACE
			socket.emit('controls update', {controls: 'fire', room: roomName});
			break;
		case 69:
			socket.emit('controls update', {controls: 'shield', room: roomName});
	}
});

$(document).keyup((event) => {
	switch (event.keyCode) {
		case 65: // A
			if (controls === 'left'){
				controls = '';
				socket.emit('controls update', {controls: '', room: roomName});
			}
			break;
		case 87: // W
			if (controls === 'up'){
				controls = '';
				socket.emit('controls update', {controls: '', room: roomName});
			}
			break;
		case 68: // D
			if (controls === 'right'){
				controls = '';
				socket.emit('controls update', {controls: '', room: roomName});
			}
			break;
		case 83: // S
			if (controls === 'down'){
				controls = '';
				socket.emit('controls update', {controls: '', room: roomName});
			}
			break;
	}
});