var express = require('express');
var router = express.Router();

const rooms_limit = 10
var rooms = []

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index');
});

router.post('/room', async (req, res) => {
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
					res.status(201).json({error: null});
				}
			} else {
				res.status(400).json({error: 'Wrong room name!'});
			}
	}
	else {
		res.status(400).json({error: 'Too much rooms!'});
	}
});

router.get('/room', async (req, res) => {
	res.status(200).json({rooms: rooms});
});

module.exports = router;
