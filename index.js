// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 21001;

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;
var roomInfo = {};

io.on('connection', (socket) => {
    console.log('connection', socket.id, socket.username, io.sockets.name, socket.namespace)

    // 获取请求建立socket连接的url
    // 如: http://localhost:3000/room/room_1, roomID为room_1
    var request = socket.request
    //var url = socket.request;
    // var splited = url.split('/');
     var roomID = "";//splited[splited.length - 1];   // 获取房间ID
     var user = '';
    // console.log('roomID is ',roomID)

    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        console.log("new message",socket.username, data)
        // we tell the client to execute 'new message'
        io.to(roomID).emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        console.log("add user", socket.id, socket.username, username)
        if (addedUser) return;

        // we store the username in the socket session for this client

        var splited = username.split("&&&")

        user = socket.username = splited[1];
        roomID = splited[0];

        ++numUsers;
        addedUser = true;

        if(!roomInfo[roomID]){
            roomInfo[roomID] = [];
        }
        roomInfo[roomID].push(user)
        socket.join(roomID)

        let data = {
            username: socket.username,
            numUsers: numUsers
        }
        console.log("emit event is user joined", " roomID is ", roomID, " and data is", data)
        io.to(roomID).emit('user joined', data);

        // socket.emit('login', {
        //     numUsers: numUsers
        // });
        //
        // // echo globally (all clients) that a person has connected
        // socket.broadcast.emit('user joined', {
        //     username: socket.username,
        //     numUsers: numUsers
        // });
    });

    // when the client emits 'typing', we broadcast it to others
    // socket.on('typing', () => {
    //     console.log("typing", socket.id, socket.username)
    //     let data = {
    //         username: socket.username
    //     }
    //     io.to(roomID).emit('typing', data)
    //     // socket.broadcast.emit('typing', {
    //     //     username: socket.username
    //     // });
    // });

    // when the client emits 'stop typing', we broadcast it to others
    // socket.on('stop typing', () => {
    //     console.log("stop typing", socket.id, socket.username)
    //     socket.broadcast.emit('stop typing', {
    //         username: socket.username
    //     });
    // });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        console.log('disconnect', socket.id, socket.username)
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});