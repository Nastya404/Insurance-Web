/* global io */
'use strict';

const socket = io();
let myUsername = null;
let timerInterval = null;
let timerSeconds = 30;

// DOM refs
const loginScreen   = document.getElementById('loginScreen');
const gameScreen    = document.getElementById('gameScreen');
const usernameInput = document.getElementById('usernameInput');
const joinBtn       = document.getElementById('joinBtn');
const playerList    = document.getElementById('playerList');
const scoreList     = document.getElementById('scoreList');
const questionBox   = document.getElementById('questionBox');
const questionText  = document.getElementById('questionText');
const questionCounter = document.getElementById('questionCounter');
const questionTimer = document.getElementById('questionTimer');
const messages      = document.getElementById('messages');
const answerInput   = document.getElementById('answerInput');
const sendBtn       = document.getElementById('sendBtn');
const startBtn      = document.getElementById('startBtn');

// --- UI helpers ---

function showGame() {
    loginScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
}

function appendMessage(html, type) {
    const el = document.createElement('div');
    el.className = 'message message--' + type;
    el.innerHTML = html;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
}

function updatePlayers(users) {
    playerList.innerHTML = users
        .map(u => `<li class="${u === myUsername ? 'me' : ''}">${escHtml(u)}${u === myUsername ? ' <em>(вы)</em>' : ''}</li>`)
        .join('');
}

function updateScores(scores) {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    scoreList.innerHTML = sorted
        .map(([name, s]) => `<li><span>${escHtml(name)}</span><span class="score-val">${s}</span></li>`)
        .join('');
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function startTimer(seconds) {
    clearInterval(timerInterval);
    timerSeconds = seconds;
    questionTimer.textContent = `⏱ ${timerSeconds}с`;
    timerInterval = setInterval(() => {
        timerSeconds--;
        questionTimer.textContent = `⏱ ${timerSeconds}с`;
        if (timerSeconds <= 5) questionTimer.classList.add('timer--urgent');
        if (timerSeconds <= 0) clearInterval(timerInterval);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    questionTimer.textContent = '';
    questionTimer.classList.remove('timer--urgent');
}

// --- Input actions ---

joinBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (name) socket.emit('join', name);
});

usernameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') joinBtn.click();
});

function sendAnswer() {
    const text = answerInput.value.trim();
    if (!text) return;
    socket.emit('answer', text);
    answerInput.value = '';
}

sendBtn.addEventListener('click', sendAnswer);
answerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendAnswer();
});

startBtn.addEventListener('click', () => {
    socket.emit('startGame');
    startBtn.classList.add('hidden');
});

// --- Socket events ---

socket.on('joined', ({ username, users, gameState, scores, currentQuestion }) => {
    myUsername = username;
    showGame();
    updatePlayers(users);
    updateScores(scores);
    appendMessage(`Вы вошли как <strong>${escHtml(username)}</strong>`, 'system');

    if (gameState === 'waiting') {
        startBtn.classList.remove('hidden');
        appendMessage('Нажмите <strong>«Начать игру»</strong>, чтобы запустить викторину!', 'system');
    } else if (gameState === 'question' && currentQuestion) {
        // Joined mid-game — show current question
        questionBox.classList.remove('hidden');
        questionCounter.textContent = `Вопрос ${currentQuestion.number} из ${currentQuestion.total}`;
        questionText.textContent = currentQuestion.text;
        appendMessage(`Идёт вопрос ${currentQuestion.number}: ${escHtml(currentQuestion.text)}`, 'question');
    }
});

socket.on('userJoined', ({ username, users }) => {
    updatePlayers(users);
});

socket.on('userLeft', ({ username, users }) => {
    updatePlayers(users);
});

socket.on('chatMessage', ({ system, username, text }) => {
    if (system) {
        appendMessage(escHtml(text), 'system');
    } else {
        const isMe = username === myUsername;
        appendMessage(
            `<span class="msg-author">${escHtml(username)}:</span> ${escHtml(text)}`,
            isMe ? 'mine' : 'other'
        );
    }
});

socket.on('gameStarted', () => {
    startBtn.classList.add('hidden');
    appendMessage('🎮 Игра началась! Отвечайте на вопросы быстрее всех — за правильный ответ +10 очков!', 'system');
});

socket.on('newQuestion', ({ number, total, text }) => {
    questionBox.classList.remove('hidden');
    questionCounter.textContent = `Вопрос ${number} из ${total}`;
    questionText.textContent = text;
    startTimer(30);
    answerInput.focus();
    appendMessage(`<strong>Вопрос ${number}/${total}:</strong> ${escHtml(text)}`, 'question');
});

socket.on('roundResult', ({ username, given, correct, answer, scores }) => {
    stopTimer();
    questionBox.classList.add('hidden');
    const isMe = username === myUsername;

    if (correct) {
        if (isMe) {
            appendMessage(
                `✅ Вы ответили: <strong>${escHtml(given)}</strong> — правильно! Ответ: <strong>${escHtml(answer)}</strong> <span class="badge-pts">+10 очков</span>`,
                'correct'
            );
        } else {
            appendMessage(
                `✅ <strong>${escHtml(username)}</strong> ответил(а): <em>${escHtml(given)}</em> — правильно! Ответ: <strong>${escHtml(answer)}</strong>`,
                'correct'
            );
        }
    } else {
        if (isMe) {
            appendMessage(
                `❌ Вы ответили: <strong>${escHtml(given)}</strong> — неверно. Правильный ответ: <strong>${escHtml(answer)}</strong>`,
                'wrong'
            );
        } else {
            appendMessage(
                `❌ <strong>${escHtml(username)}</strong> ответил(а): <em>${escHtml(given)}</em> — неверно. Правильный ответ: <strong>${escHtml(answer)}</strong>`,
                'wrong'
            );
        }
    }
    updateScores(scores);
});

socket.on('timeUp', ({ hint }) => {
    stopTimer();
    questionBox.classList.add('hidden');
    appendMessage(`⌛ Время вышло! Правильный ответ: <strong>${escHtml(hint)}</strong>`, 'timeout');
});

socket.on('gameOver', ({ scores }) => {
    stopTimer();
    questionBox.classList.add('hidden');
    const winner = scores[0];
    let html = '<div class="gameover-box">';
    html += '<div class="gameover-title">🏆 Игра окончена!</div>';
    if (winner) {
        html += `<div class="gameover-winner">Победитель: <strong>${escHtml(winner.name)}</strong> — ${winner.score} очков</div>`;
    }
    html += '<table class="gameover-table"><tr><th>#</th><th>Игрок</th><th>Очки</th></tr>';
    scores.forEach(({ name, score }, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        html += `<tr><td>${medal}</td><td>${escHtml(name)}</td><td>${score}</td></tr>`;
    });
    html += '</table><div class="gameover-reset">Новая игра начнётся через 15 секунд...</div></div>';
    appendMessage(html, 'system');
    updateScores(Object.fromEntries(scores.map(({ name, score }) => [name, score])));
});

socket.on('gameReset', () => {
    appendMessage('🔄 Игра сброшена. Нажмите «Начать игру» для новой партии!', 'system');
    startBtn.classList.remove('hidden');
});
