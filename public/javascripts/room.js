'use strict';

var socket = io();
const roomName = window.location.pathname.split('/')[2];
var username = '';
var allMessages = [];
var players = [];

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

const playerSize = 30;

var canvas = document.getElementById('canvas');
//canvas.width = 100;
var context = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 900;
//$('#canvas').width($('#canvas').height()*4/3);
console.log($('#canvas').width());
console.log($('#canvas').height());
console.log(canvas.width +';' +canvas.height);
socket.on('game update', function(data) {
	players = data.players;
});

function update(){
	//context.canvas.width = window.innerWidth;
	//console.log(innerWidth);
    //context.canvas.height = window.innerWidth;
	context.fillStyle = "#101010";
	context.fillRect(0,0,canvas.width,canvas.height);
	context.fillStyle = "#909090";
	for (var i = 0; i < players.length; i++) {
		//console.log(players[i].x +':'+ players[i].y);
		context.fillRect(players[i].x, players[i].y, playerSize, playerSize);
	}
	setTimeout(update, 30);
}

document.addEventListener('keydown', (event) => {
	//event.preventDefault();
	/* var movement = {
		left: false,
		up: false,
		right: false,
		down: false
	} */
	console.log('keydown');
	var movement = '';
	switch (event.keyCode) {
		case 65: // A
			movement = 'left';
			//movement.left = true;
			break;
		case 87: // W
			movement = 'up';
			//movement.up = true;
			break;
		case 68: // D
			movement = 'right';
			//movement.right = true;
			break;
		case 83: // S
			movement = 'down';
			//movement.down = true;
			break;
	}
	socket.emit('controls update', {movement: movement, room: roomName});
});

document.addEventListener('keyup', (event) => {
	//event.preventDefault();
	/* var movement = {
		left: false,
		up: false,
		right: false,
		down: false
	} */
	console.log('keyup');
	switch (event.keyCode) {
		case 65: // A
		case 87: // W
		case 68: // D
		case 83: // S
			socket.emit('controls update', {movement: '', room: roomName});
			break;
	}
});

update();