var ticTacToe = {
    gameId: null,
    mark: null,
    i: false,
    interval: null,
    init: function() {
        $(function() {
            // Подключаемся к серверу nodejs с socket.io
            var socket = io.connect('http://' + window.location.hostname + ':3000');
//            var socket = io.connect('http://localhost:3000');
            $('#find').hide().click(function() {
                $('#find').off('click').click(function(){window.location.reload();});
                socket.emit('start');
            });
            socket.on('connect', function () {
                $('#status').html('Успешно подключились к игровому серверу');
                $('#find').show();
            });
            socket.on('reconnect', function () {
                $('#find').show();
                $('#connect-status').html('Переподключились, продолжайте игру');
            });
            socket.on('reconnecting', function () {
                $('#find').hide();
                $('#status').html('Соединение с сервером потеряно, переподключаемся...');
            });
            socket.on('error', function (e) {
                $('#status').html('Ошибка: ' + (e ? e : 'неизвестная ошибка'));
            });
            // Ожидаем соперника
            socket.on('wait', function(){
                $('#find').addClass('wait').text('Ожидаем соперника...');
            });
            // Соперник отлючился
            socket.on('exit', function(){
                ticTacToe.endGame(ticTacToe.turn, 'exit');
            });
            // Время на ход вышло
            socket.on('timeout', function(mark) {
                ticTacToe.endGame(mark, 'timeout');
            });
            // К нам подключился соперник, начинаем игру
            socket.on('ready', function(gameId, mark, x, y) {
                $('#status').html('К вам подключился соперник! Игра началась! ' + (mark == 'X' ? 'Сейчас Ваш первый ход' : 'Сейчас ходит соперник') + '!');
                ticTacToe.startGame(gameId, mark, x, y);
                $('#stats').append($('<li/>').attr('class', 'mark').html('Вы играете: <b>' + (mark=='X'?'Крестиком':'Ноликом') + '</b>'));
                $("#board-table td").click(function (e) {
                    if(ticTacToe.i) socket.emit('step', ticTacToe.gameId, e.target.id);
                });
            });
            // Получаем ход
            socket.on('step', function(id, mark, win) {
                ticTacToe.move(id, mark, win);
            });
            // Статистика
            socket.on('stats', function (arr) {
                var stats = $('#stats');
                stats.find('li').not('.mark').remove();
                for(val in arr) {
                    stats.prepend($('<li/>').html(arr[val]));
                }
            });
        });
    },

    startGame: function (gameId, mark, x, y) {
        this.gameId = gameId;
        this.mark = mark;
        this.i = (mark == 'X');
        $('#find').hide();
        var table = $('#board-table').empty();
        for(var i = 1; i <= y; i++) {
            var tr = $('<tr/>');
            for(var j = 0; j < x; j++) {
                tr.append($('<td/>').attr('id', (j+1) + 'x' + i).html('&nbsp;'));
            }
            table.append(tr);
        }
        $("#board,#timer").show();
        this.mask(!this.i);
    },

    mask: function(state) {
        var mask = $('#mask'), board = $('#board-table');
        clearInterval(this.interval);
        $('#timer-label').show();
        $('#timer').html(15);
        this.interval = setInterval(function(){
            var i = parseInt($('#timer').html());
            i--;
            $('#timer').html(i);
        }, 1000);
        if(state) {
            mask.show();
            var p = board.position();
            mask.css({
                width: board.width(),
                height: board.height()
            });
        } else {
            mask.hide();
        }
    },

    move: function (id, mark, win) {
        this.i = (mark != this.mark);
        $("#" + id).html(mark);
        if (!win) {
            this.mask(!this.i);
            $('#status').html('Сейчас ' + (this.i ? 'ваш ход' : 'ходит соперник'));
        } else {
            this.endGame(mark, win);
        }
    },

    endGame: function (mark, win) {
        clearInterval(this.interval);
        var text = '';
        switch(win) {
            case 'none': text = 'Ничья!'; break;
            case 'timeout': text = (mark == this.mark ? 'Слишком долго думали! Вы проиграли!' : 'Соперник так и не смог решить как ему ходить! Вы победили!'); break;
            case 'exit': text = 'Соперник сбежал с поля боя! Игра закончена'; break;
            default: text = 'Вы ' + (this.i ? 'проиграли! =(' : 'выиграли! =)');
        }
        $('<div/>', {
            class: 'notify',
            text: text
        }).click(function(){window.location.reload();}).appendTo('#notify-container');

        $('<div/>', {
            class: 'notify',
            text: 'Попробовать еще раз'
        }).click(function(){window.location.reload();}).appendTo('#notify-container');
    }
};
ticTacToe.init();