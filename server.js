import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rest from './rest.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(rest);

app.get('/', (req, res) => {
    res.send("<h2>It's Working!</h2>");
});

// --- Quiz game data ---
const QUESTIONS = [
    { text: 'Как расшифровывается аббревиатура ОСАГО?', answer: 'обязательное страхование автогражданской ответственности', hint: 'Обязательное страхование автогражданской ответственности' },
    { text: 'Как называется сумма, которую страхователь платит страховщику за страховку?', answer: 'страховая премия', hint: 'Страховая премия' },
    { text: 'Аббревиатура ДМС означает...?', answer: 'добровольное медицинское страхование', hint: 'Добровольное медицинское страхование' },
    { text: 'Что страхует полис КАСКО?', answer: 'автомобиль', hint: 'Автомобиль (транспортное средство)' },
    { text: 'Как называется документ, подтверждающий факт страхования?', answer: 'страховой полис', hint: 'Страховой полис' },
    { text: 'Что такое «страховой случай»?', answer: 'событие', hint: 'Событие, при наступлении которого выплачивается возмещение' },
    { text: 'Страхование жизни относится к какому виду: обязательному или добровольному?', answer: 'добровольному', hint: 'Добровольному' },
];

// --- Game state ---
const game = {
    state: 'waiting',   // waiting | question | intermission | gameover
    currentQuestion: -1,
    scores: {},
    questionTimer: null,
    answeredBy: null,
};

const users = {};   // socketId -> username

function startNextQuestion() {
    game.currentQuestion++;
    if (game.currentQuestion >= QUESTIONS.length) {
        endGame();
        return;
    }
    game.state = 'question';
    game.answeredBy = null;
    const q = QUESTIONS[game.currentQuestion];
    io.emit('newQuestion', {
        number: game.currentQuestion + 1,
        total: QUESTIONS.length,
        text: q.text,
    });
    game.questionTimer = setTimeout(() => {
        if (game.state !== 'question') return;
        io.emit('timeUp', { hint: q.hint });
        game.state = 'intermission';
        setTimeout(startNextQuestion, 4000);
    }, 30000);
}

function endGame() {
    game.state = 'gameover';
    clearTimeout(game.questionTimer);
    const sorted = Object.entries(game.scores)
        .sort((a, b) => b[1] - a[1])
        .map(([name, score]) => ({ name, score }));
    io.emit('gameOver', { scores: sorted });
    setTimeout(() => {
        game.currentQuestion = -1;
        game.state = 'waiting';
        game.scores = {};
        Object.values(users).forEach(name => { game.scores[name] = 0; });
        io.emit('gameReset');
    }, 15000);
}

// --- Socket.IO ---
io.on('connection', (socket) => {

    socket.on('join', (rawName) => {
        const name = String(rawName || '').trim().slice(0, 20) || `Гость_${socket.id.slice(0, 4)}`;
        users[socket.id] = name;
        if (game.scores[name] === undefined) game.scores[name] = 0;

        socket.emit('joined', {
            username: name,
            users: Object.values(users),
            gameState: game.state,
            questionIndex: game.currentQuestion,
            scores: game.scores,
            currentQuestion: game.state === 'question' ? {
                number: game.currentQuestion + 1,
                total: QUESTIONS.length,
                text: QUESTIONS[game.currentQuestion].text,
            } : null,
        });

        socket.broadcast.emit('userJoined', { username: name, users: Object.values(users) });
        io.emit('chatMessage', { system: true, text: `${name} присоединился к игре` });
    });

    socket.on('startGame', () => {
        if (game.state !== 'waiting') return;
        if (!users[socket.id]) return;
        game.currentQuestion = -1;
        game.scores = {};
        Object.values(users).forEach(name => { game.scores[name] = 0; });
        io.emit('gameStarted');
        startNextQuestion();
    });

    socket.on('answer', (raw) => {
        const username = users[socket.id];
        if (!username) return;
        if (game.state !== 'question') return;

        const text = String(raw || '').trim();
        if (!text) return;

        clearTimeout(game.questionTimer);
        game.state = 'intermission';

        const q = QUESTIONS[game.currentQuestion];
        const correct = text.toLowerCase().includes(q.answer);

        if (correct) {
            game.scores[username] = (game.scores[username] ?? 0) + 10;
        }

        io.emit('roundResult', {
            username,
            given: text,
            correct,
            answer: q.hint,
            scores: { ...game.scores },
        });

        setTimeout(startNextQuestion, 4000);
    });

    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            delete users[socket.id];
            io.emit('userLeft', { username, users: Object.values(users) });
            io.emit('chatMessage', { system: true, text: `${username} покинул игру` });
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
