# mpgame
Simple multiplayer browser game that uses several services
## Getting Started
### Prerequisites
To run this project on your local machine you will need:
1. [Node.js](https://nodejs.org/en/)
2. [MongoDB](https://www.mongodb.com/download-center/community)
3. [RabbitMQ](https://www.rabbitmq.com/download.html)
### Installing
Clone or download repository. Than install all dependencies:
```
npm install
```

Add database mpgame to the mongodb. You can do it through the mongodb shell:
```
use mpgame
```
### Running
To start a game first run database service:
```
node database.js
```
If everything is all right you should see:
```
connected to database
```
Than open another shell and run main service of the game:
```
npm start
```
or:
```
node server.js
```
Now you can open address http://localhost:3000/ in you browser to test the game.
