var express = require('express');
var router = express.Router();

const rooms_limit = 10
var rooms = []

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index');
});

router.post('/room', async (req, res) => {
	try {
		newRoomName = req.body.roomName;
		if (rooms.length <= rooms_limit){
				if ((newRoomName != "") && (newRoomName != undefined)){
					var is_unique = true;
					for(var i = 0; i < rooms.length; i++) {
						if (rooms[i].name === newRoomName){
							is_unique = false;
							break;
						}
					}
					if (!is_unique){
						res.status(400).send({error: 'Room with this name already exists!'});
					} else {
						rooms.push({name: req.body.roomName});
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
		pool.close();
		throw(err);
	}
});

router.get('/rooms', async (req, res) => {
	try {
		res.status(200).json({rooms: rooms});
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

router.delete('/rooms/:roomName', async(req, res) => {
	try {
		const roomName = req.params.roomName;
		roomNumber = -1;
		for(var i = 0; i < rooms.length; i++) { 
			if (rooms[i].name === roomName) {
				roomNumber = i;
				break;
			}
		}
		if (roomNumber === -1)
			res.status(400).json({error: 'Wrong room name!'});
		else {
			rooms.splice(i, 1);
			res.sendStatus(200);
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

module.exports = router;
