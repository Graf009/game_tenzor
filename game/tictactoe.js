var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var ticTacToe = function() {
    // Инициализируем события
    EventEmitter.call(this);
    // Массив id игры = объект игры
    this.games = [];
    // Массив подключённых пользователей = id игры
    this.users = [];
    // Массив пользователей ожидающих оппонентов для начало игры
    this.idles = [];
    // Размеры поля
    this.x = 30;
    this.y = 17;
    // Шагов до победы
    this.stepsToWin = 5;
}
util.inherits(ticTacToe, EventEmitter);
module.exports = ticTacToe;

var game = function(user, opponent, x, y, stepsToWin) {
    // Инициализируем события
    EventEmitter.call(this);
    // Ячейки игрового поля
    this.board = [];
    // Игроки
    this.user = user; // X
    this.opponent = opponent; // O
    // Размеры поля
    this.x = x;
    this.y = y;
    // Шагов до победы
    this.stepsToWin = stepsToWin;
    // Кол-во сделанных ходов
    this.steps = 0;
    // Чем ходит
    this.mark = 'X';
    // Таймер хода
    this.timeout = null;
    // Запускаем таймер
    this.on('timer', function(state, user) {
        if(state == 'stop') {
            clearTimeout(this.timeout);
            this.timeout = null;
        } else {
            var game = this;
            this.timeout = setTimeout(function() {
                game.emit('timeout', user);
            }, 15000);
        }
    });
}
util.inherits(game, EventEmitter);

/**
 * Запускаем игру
 */
ticTacToe.prototype.start = function(user, cb) {
    // Размер игрового поля и кол-во ходов для победы
    // Ищем свободные игры
    if(Object.keys(this.idles).length > 0) {
        var opponent = Object.keys(this.idles).shift();
        delete this.idles[opponent];
        // Если есть ожидающие игру, создаём им игру
        var gameElement = new game(user, opponent, this.x, this.y, this.stepsToWin);
        var id = [
              Math.random() * 0xff | 0
            , Date.now()
        ].join('');
        // Добавляем игру в список действующих
        this.games[id] = gameElement;
        this.users[user] = id;
        this.users[opponent] = id;
        gameElement.emit('timer', 'start', user);
        cb(true, id, opponent, this.x, this.y);
    } else {
        // Пока нет, значит будем ждать
        this.idles[user] = true;
        cb(false);
    }
}

/**
 * Выходим из игры
 */
ticTacToe.prototype.end = function(user, cb) {
    delete this.idles[user];
    if(this.users[user] === undefined) return;
    var gameId = this.users[user];
    if(this.games[gameId] === undefined) return;
    var game = this.games[gameId];
    var opponent = (user == game.user ? game.opponent : game.user);
    var mark = game.mark;
    delete this.games[gameId];
    game = null;
    delete this.users[user];
    cb(gameId, opponent, mark);
}

/**
 * Сделан ход
 */
ticTacToe.prototype.step = function(gameId, x, y, user, cb) {
    //console.info('Step');
    this.games[gameId].step(x, y, user, cb);
}

game.prototype.step = function(x, y, user, cb) {
    if(this.board[x + 'x' + y] !== undefined || this.getTurn(user) != this.mark) return;
    this.emit('timer', 'stop');
    this.board[x + 'x' + y] = this.getTurn(user);
    this.mark = (user != this.user ? 'X' : 'O');
    this.steps++;
    this.emit('timer', 'start', (user == this.user ? this.opponent : this.user));
    cb(this.checkWinner(x, y, this.getTurn(user)), this.getTurn(user));
}

/**
 * Получаем чем ходит игрок
 */
game.prototype.getTurn = function(user) {
    return (user == this.user ? 'X' : 'O');
}

/**
 * Проверяем нет ли победителя
 */
game.prototype.checkWinner = function(x, y, mark) {
    // Проверка на ничью, если нет больше свободных полей
    if(this.steps == (this.x * this.y)) {
        // Ничья
        return 'none';
        // Проверка на победителя
    } else if(
        this.checkWinnerDynamic('-', x, y, mark)
        || this.checkWinnerDynamic('|', x, y, mark)
        || this.checkWinnerDynamic('\\', x , y, mark)
        || this.checkWinnerDynamic('/', x, y, mark)
        ) {
        // есть победитель
        return true;
    } else {
        // нет победителя
        return false;
    }
}

/**
 * Алгоритм для поля XxY с выиграшем в N полей
 * a - каким алгоритмом ищем
 * now - номер поля куда был сделан ход
 * turn - крестик или нолик ходили
 */
game.prototype.checkWinnerDynamic = function(a, x, y, mark) {
    // будем проверять динамически 4 комбинации: горизонталь, вертикаль и 2 диагонали
    // при этом мы не знаем на какой позиции текущий ход,, проверять будем во всех 4 направлениях
    var win = 1;
    switch(a) {

        // поиск по горизонтали
        case '-':
            var toLeft = toRight = true,
                min = x - this.stepsToWin, max = x + this.stepsToWin;
            min = (min < 1) ? 1 : min;
            max = (max > this.x) ? this.x : max;
            for(var i = 1; i <= this.stepsToWin; i++) {
                if(win >= this.stepsToWin) return true;
                if(!toLeft && !toRight) return false;
                if(toLeft && min <= (x-i) && this.board[(x-i) + 'x' + y] == mark) { win++; } else { toLeft = false; }
                if(toRight && (x+i) <= max && this.board[(x+i) + 'x' + y] == mark) { win++; } else { toRight = false; }
            }
            break;

        // поиск по вертикали
        case '|':
            var toUp = toDown = true,
                min = y - this.stepsToWin, max = y + this.stepsToWin;
            min = (min < 1) ? 1 : min;
            max = (max > this.y) ? this.y : max;
            for(var i = 1; i <= this.stepsToWin; i++) {
                if(win >= this.stepsToWin) return true;
                if(!toUp && !toDown) return false;
                if(toUp && min <= (y-i) && this.board[x + 'x' + (y-i)] == mark) { win++; } else { toUp = false; }
                if(toDown && (y+i) <= max && this.board[x + 'x' + (y+i)] == mark) { win++; } else { toDown = false; }
            }
            break;

        // поиск по диагонали сверху вниз
        case '\\':
            var toUpLeft = toDownRight = true,
                minX = x - this.stepsToWin, maxX = x + this.stepsToWin,
                minY = y - this.stepsToWin, maxY = y + this.stepsToWin;
            minX = (minX < 1) ? 1 : minX;
            maxX = (maxX > this.x) ? this.x : maxX;
            minY = (minY < 1) ? 1 : minY;
            maxY = (maxY > this.y) ? this.y : maxY;
            for(var i = 1; i <= this.stepsToWin; i++) {
                if(win >= this.stepsToWin) return true;
                if(!toUpLeft && !toDownRight) return false;
                if(toUpLeft && minX <= (x-i) && minY <= (y-i) && this.board[(x-i) + 'x' + (y-i)] == mark) { win++; } else { toUpLeft = false; }
                if(toDownRight && (x+i) <= maxX && (y+i) <= maxY && this.board[(x+i) + 'x' + (y+i)] == mark) { win++; } else { toDownRight = false; }
            }
            break;

        // поиск по диагонали снизу вверх
        case '/':
            var toDownLeft = toUpRight = true,
                minX = x - this.stepsToWin, maxX = x + this.stepsToWin,
                minY = y - this.stepsToWin, maxY = y + this.stepsToWin;
            minX = (minX < 1) ? 1 : minX;
            maxX = (maxX > this.x) ? this.x : maxX;
            minY = (minY < 1) ? 1 : minY;
            maxY = (maxY > this.y) ? this.y : maxY;
            for(var i = 1; i <= this.stepsToWin; i++) {
                if(win >= this.stepsToWin) return true;
                if(!toDownLeft && !toUpRight) return false;
                if(toDownLeft && minX <= (x-i) && (y+i) <= maxY && this.board[(x-i) + 'x' + (y+i)] == mark) { win++; } else { toDownLeft = false; }
                if(toUpRight && (x+i) <= maxX && (y-i) <= maxY && this.board[(x+i) + 'x' + (y-i)] == mark) { win++; } else { toUpRight = false; }
            }
            break;

        default: return false; break;
    }
    return(win >= this.stepsToWin);
}