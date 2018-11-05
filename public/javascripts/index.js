'use strict';

$("#addRoomForm").submit(event => {
	event.preventDefault();
});
$("#addRoomForm").submit(submitRoomForm);
getRoomList();

function deleteRoom(roomName){console.log('triedToDeleteTheRoom: ' + roomName)}

function connectToARoom(roomName){};

function getRoomList(){
	$('#roomsList').empty();
	$.ajax({
		type: 'GET',
        url: '/room',
        success: function(response) {
			const rooms = response.rooms;
			console.log(response);
			for(var i = 0; i < rooms.length; i++){
				const roomName = $('<a></a>').text(rooms[i].name);
				roomName.attr('style', 'flex: 95%');
				roomName.click(connectToARoom(rooms[i].name));
				const delLink = $('<a></a>').text('X');
				delLink.attr('class', 'deleteRoomLink');
				delLink.attr('style', 'flex: 5%');
				delLink.click(deleteRoom(rooms[i].name));
				const flexDiv = $('<div></div>');
				flexDiv.attr('style', 'display: flex');
				flexDiv.append(roomName, delLink)
				$('#roomsList').append(flexDiv);
			}
		},
		error: function(xhr, status, error) {
			var err = JSON.parse(xhr.responseText);
			console.log(err.error);
		}
	});
}

function submitRoomForm(){
	const formData = { 'roomName': $('#newRoomName').val() };
	$.ajax({
		type: 'POST',
        url: '/room',
		data: formData,
        success: function(response) {
			console.log('added room');
			getRoomList();
		},
		error: function(xhr, status, error) {
			var err = JSON.parse(xhr.responseText);
			console.log(err.error);
		}
	});
};