var express = require('express');
var router = express.Router();

router.use.rooms_limit = 10;
router.use.players_limit = 10;
router.use.rooms = [];

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index');
});

router.post('/room', async (req, res) => {
	try {
		newRoomName = req.body.roomName;
		if (router.use.rooms.length <= router.use.rooms_limit){
				if ((newRoomName != "") && (newRoomName != undefined)){
					var is_unique = true;
					for(var i = 0; i < router.use.rooms.length; i++) {
						if (router.use.rooms[i].name === newRoomName){
							is_unique = false;
							break;
						}
					}
					if (!is_unique){
						res.status(400).send({error: 'Room with this name already exists!'});
					} else {
						router.use.rooms.push({name: req.body.roomName, players: []});
						res.sendStatus(201);
					}
				} else {
					res.status(400).json({error: 'Wrong room name!'});
				}
		}
		else {
			res.status(400).json({error: 'Too much rooms!'});
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

router.get('/rooms', async (req, res) => {
	try {
		var safeRooms = [];
		for (var i = 0; i < router.use.rooms.length; i++){
			safeRooms.push({name: router.use.rooms[i].name, players: []});
			for (var j = 0; j < router.use.rooms[i].players.length; j++){
				safeRooms[i].players.push({username: router.use.rooms[i].players[j].username})
			}
		}
		res.status(200).json({rooms: safeRooms, players_limit: router.use.players_limit});
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

router.get('/room/:roomName', async (req, res) => {
	try {
		const roomName = req.params.roomName;
		roomNumber = -1;
		for(var i = 0; i < router.use.rooms.length; i++) {
			if (router.use.rooms[i].name === roomName) {
				roomNumber = i;
				break;
			}
		}
		if (roomNumber === -1)
			res.status(404).render('customError', {error: 'Wrong room name!'});
		else {
			res.render('room');
		}
	} catch (err) {
		console.log(err);
		res.status(500).render('customError', {error: 'Iternal error!'});
	}
});

/* router.post('/room/:roomName', async (req, res) => {
	try {
		const roomName = req.params.roomName,
		      username = req.body.username,
		      userId = req.body.userId;
			  
		var roomIndex = -1;
		for(var i = 0; i < router.use.rooms.length; i++) {
			if (router.use.rooms[i].name === roomName) {
				roomIndex = i;
				break;
			}
		}
		if (roomIndex === -1)
			res.status(400).json({error: 'Wrong room name!'});
		else {
			if (router.use.rooms[roomIndex].players.length > router.use.players_limit) {
				res.status(400).json({error: 'Too much players in this room!'});
			} else {
				var isUsernameUnique = true;
				for (var i = 0; i < router.use.rooms[roomIndex].players.length; i++){
					if (router.use.rooms[roomIndex].players[i] === username){
						isUsernameUnique = false;
						break;
					}
				}
				if (!isUsernameUnique){
					res.status(400).send({error: 'There is already exist a player with this name in the room!'});
				} else {
					router.use.rooms[roomIndex].players.push({username: username, id: userId});
					console.log('Player ' + username + ' connected to the room ' + roomName);
					res.sendStatus(200);
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
}); */

router.delete('/room/:roomName', async(req, res) => {
	try {
		const roomName = req.params.roomName;
		roomIndex = -1;
		for(var i = 0; i < router.use.rooms.length; i++) {
			if (router.use.rooms[i].name === roomName) {
				roomIndex = i;
				break;
			}
		}
		if (roomIndex === -1)
			res.status(400).json({error: 'Wrong room name!'});
		else {
			router.use.rooms.splice(i, 1);
			res.sendStatus(200);
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

module.exports = router;
