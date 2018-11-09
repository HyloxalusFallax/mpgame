'use strict';

var socket = io();
const roomName = window.location.pathname.split('/')[2];
var username = '';

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
	socket.emit('post message', message);
}

socket.on('registration', (msg) => {
	console.log(msg);
	if (msg === 'ok') {
		$.modal.close();
	} else {
		
	}
});

socket.on('post message', (msg) => {
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
});