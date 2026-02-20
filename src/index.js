const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');

const Games = require('./games');
const { Room, rooms, stats, idToRoom, getRoomStatus } = require('./room');
const { broadcastRealtime, realtimeClients } = require('./realtime');

for (const id in Games) stats[id] = { id, rooms: 0, players: 0 };

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.set('trust proxy', true);
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    // res.setHeader("Cache-Control", "no-store");
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'ignore' }));
app.use('/enums', express.static(path.join(__dirname, 'enums')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.get('/games', (req, res) => res.status(200).send(Object.values(stats)));
app.get('/rooms', (req, res) => res.status(200).send([...rooms]
    .filter(room => room.settings.public)
    .map(getRoomStatus)));
app.post('/make', cooldown(60), (req, res) => {
    console.log(req.body)
    const gameId = req.body.game;
    if (gameId in Games) {
        delete req.body.game;
        const room = new Games[gameId](req.body, gameId);
        res.redirect(303, room.url + '&host=true'); // prevents form resubmission
    } else {
        res.sendStatus(404);
    }
});

function cooldown(s) {
    s *= 1000;
    const cooldowns = {};
    return (req, res, next) => {
        const now = Date.now();
        if (now - (cooldowns[req.ip] || 0) < s)
            return res.sendStatus(203);
        cooldowns[req.ip] = now;
        next();
    };
}

const ipsOnCooldown = new Map;
wss.on('connection', (ws, req) => {
    ws.ip = ws._socket.remoteAddress;
    const cooldown = ipsOnCooldown.get(ws.ip);
    const now = Date.now();
    if (cooldown && cooldown > now)
        return ws.close(1009, 'On cooldown');
    console.log(ws.ip, req.url);
    if (req.url === '/realtime') {
        realtimeClients.add(ws);
        ws.on('message', () => {
            ipsOnCooldown.set(ws.ip, Date.now() + 60000);
            ws.close(1009, 'Unauthorized');
        });
    } else {
        const u = new URLSearchParams(req.url.split('?')[1]);
        const id = parseInt(u.get('id') || 0),
            code = u.get('code') || '';
        const room = idToRoom.get(id);
        if (!room) return ws.close(1009, 'Unknown room');
        ws.nickname = u.get('nickname') || '';
        room.join(ws, code);
        ws.on('message', message => {
            try {
                var { type, data } = JSON.parse(message);
            } catch {
                ipsOnCooldown.set(ws.ip, Date.now() + 60000);
                ws.close(1009, 'Unauthorized');
            }
            room.constructor.handlers[type]?.call(room, ws, data);
        });
        ws.on('close', () => room.leave(ws));
    }
});

server.listen(8888, () => {
    console.log('listening...');
});