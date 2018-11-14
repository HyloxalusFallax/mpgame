'use strict';

var socket = io();
const roomName = window.location.pathname.split('/')[2];
var username = '';
var allMessages = [];
var players = [];
var walls = [];

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
	update();
});

function update(){
	context.fillStyle = "#101010";
	context.fillRect(0,0,canvas.width,canvas.height);
	context.fillStyle = "#909090";
	for (var i = 0; i < players.length; i++) {
		context.fillRect(players[i].x1, players[i].y1, players[i].x2-players[i].x1, players[i].y2-players[i].y1);
	}
	context.fillStyle = "yellow";
	for (var i = 0; i < walls.length; i++) {
		context.fillRect(walls[i].x1, walls[i].y1, walls[i].x2-walls[i].x1, walls[i].y2-walls[i].y1);
	}
}

$('#messageInput').focus(() =>{
	socket.emit('controls update', {movement: '', room: roomName});
});

$(document).focusout(() => {
	socket.emit('controls update', {movement: '', room: roomName});
});

var movement = '';

$(document).keydown((event) => {
	if($(':focus').length)
		return;
	console.log(event.keyCode);
	switch (event.keyCode) {
		case 65: // A
			movement = 'left';
			socket.emit('controls update', {movement: movement, room: roomName});
			break;
		case 87: // W
			movement = 'up';
			socket.emit('controls update', {movement: movement, room: roomName});
			break;
		case 68: // D
			movement = 'right';
			socket.emit('controls update', {movement: movement, room: roomName});
			break;
		case 83: // S
			movement = 'down';
			socket.emit('controls update', {movement: movement, room: roomName});
			break;
	}
});

$(document).keyup((event) => {
	switch (event.keyCode) {
		case 65: // A
			if (movement === 'left'){
				movement = '';
				socket.emit('controls update', {movement: '', room: roomName});
			}
			break;
		case 87: // W
			if (movement === 'up'){
				movement = '';
				socket.emit('controls update', {movement: '', room: roomName});
			}
			break;
		case 68: // D
			if (movement === 'right'){
				movement = '';
				socket.emit('controls update', {movement: '', room: roomName});
			}
			break;
		case 83: // S
			if (movement === 'down'){
				movement = '';
				socket.emit('controls update', {movement: '', room: roomName});
			}
			break;
	}
});