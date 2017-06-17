const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

let roomList = [];

server.listen(port, function () {
    console.log(`Server listening at port ${port}`);
});

// Routing
app.use(express.static(__dirname + '/html'));


io.on('connection', function (socket) {
    // Добавление пользователя в комнату
    socket.on('new user', function (userName, roomName) {

        socket.userName = userName;
        socket.roomName = roomName;
        // Ищем существует ли комната
        let index = roomList.findIndex(obj => obj.roomName == roomName);
        // Нет комнаты
        if(index < 0){
            // Создаем комнату
            roomList.push({
                roomName: roomName,
                users: []
            });
            index = roomList.length -1;
        }
        let users = roomList[index].users;
        // Добавляем информацию о пользователе
        users.push(userName);
        // Подключем пользователя к комнате
        socket.join(roomName);
        // Отправляем ответ клиентам
        io.in(roomName).emit('user joined', roomName, users);

    });

    // Отсоединение пользователя
    socket.on('disconnect', function () {

        let userName = socket.userName;
        let roomName = socket.roomName;

        // Ищем номер комнаты
        let roomIndex = roomList.findIndex(obj => obj.roomName == roomName);

        if(roomIndex < 0) return;

        let users = roomList[roomIndex].users;

        let userIndex = users.findIndex(obj => obj == userName);
        //Удаляем пользователя из комнаты
        users.splice(userIndex, 1);
        // Если в комнате никого не осталось, то удаляем комнату
        if(users.length == 0){
            roomList.splice(roomIndex, 1);
        }
        // в комнате кто-то остался. Отпраляем сообщение
        else {
            io.in(roomName).emit('user left', userName, users);
        }

    });

    // Ретрансляция сообщения
    socket.on('new message', function (data) {

        socket.to(socket.roomName).emit('new message', {
            username: socket.userName,
            message: data
        });
    });
});

