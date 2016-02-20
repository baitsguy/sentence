var express = require('express');
var app = express();
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendfile('index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
});

app.listen(3000, function(){
    console.log('listening on *:3000');
});