'use strict';

$("#addRoomForm").submit(event => {
	event.preventDefault();
});
$("#addRoomForm").submit(submitRoomForm);
getRoomList();

function deleteRoom(roomName){
	return function(event) {
		event.preventDefault();
		$.ajax({
			type: 'DELETE',
			url: '/room/' + roomName,
			success: function(response) {
				getRoomList();
			},
			error: function(xhr, status, error) {
				var err = JSON.parse(xhr.responseText);
				console.log(err.error);
			}
		});
	}
}

function getRoomList(){
	$('#roomsList').empty();
	$.ajax({
		type: 'GET',
        url: '/rooms',
        success: function(response) {
			const rooms = response.rooms;
			for(var i = 0; i < rooms.length; i++){
				const roomName = $('<a></a>').text(rooms[i].name);
				roomName.attr('class', 'roomName');
				roomName.attr('style', 'flex: 90%');
				roomName.attr('href', '/room/' + rooms[i].name);
				//roomName.click(connectToARoom(rooms[i].name));
				const delLink = $('<a></a>').text('X');
				delLink.attr('class', 'deleteRoomLink');
				delLink.click(deleteRoom(rooms[i].name));
				const flexDiv = $('<div></div>');
				flexDiv.attr('class', 'roomListRow');
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
			getRoomList();
		},
		error: function(xhr, status, error) {
			var err = JSON.parse(xhr.responseText);
			console.log(err.error);
		}
	});
};