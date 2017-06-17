
$(function() {

    const COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];
    const FADE_TIME = 150; // ms

    let username, roomname;
    let $window = $(window);


    let $usernameInput = $('.usernameInput'); // Input for username
    let $roomnameInput = $('.roomnameInput'); // Input for roomname
    let $messages = $('.messages'); // Messages area
    let $inputMessage = $('.inputMessage'); // Input message input box
    let $loginPage = $('.login.page'); // The login page
    let $chatPage = $('.chat.page'); // The chatroom page
    let $roomname = $('.roomname');
    let $userslist = $('.userslist');

    const socket = io();

    // Adds user to the room
    function addUser() {
        username = cleanInput($usernameInput.val().trim());
        roomname = cleanInput($roomnameInput.val().trim());

        // If the username and roomname is valid
        if (username && roomname) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();

            // Tell the server your username
            socket.emit('new user', username, roomname);
        }
    }

    // Sends a chat message
    function sendMessage () {
        let message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message /*&& connected*/) {
            $inputMessage.val('');
            addChatMessage({
                username: username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', message);
        }
    }

    // Adds the visual chat message to the message list
    function addChatMessage (data, options) {

        let $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUsernameColor(data.username));
        let $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        let $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }


    // Log a message
    function log (message, options) {
        let $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement (el, options) {
        let $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }


    // Gets the color of a username through our hash function
    function getUsernameColor (username) {
        // Compute hash code
        let hash = 7;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        let index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }


    // Prevents input from having injected markup
    function cleanInput (input) {
        return $('<div/>').text(input).text();
    }


// Keyboard events

    $window.keydown(function (event) {

        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (username && roomname) {
                sendMessage();
            } else {
                addUser();
            }
        }
    });


    //Обработчики сообщений сервера
    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (roomname, users) {
        $roomname.text('Текущая комната: ' + roomname);
        $userslist.text('Сейчас в комнате: ' + users.join(', '));
        log(users[users.length - 1] + ' вошел в комнату ' + roomname);
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', function (data) {
        console.log('ddd');
        addChatMessage(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (username, users) {
        $userslist.text('Сейчас в комнате: ' + users.join(', '));
        log(username + ' покинул комнату');
    });

    socket.on('disconnect', function () {
        log('Вы были отключены от чата');
    });
});