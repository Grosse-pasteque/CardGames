const path = require('path');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.set('trust proxy', true);
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/games', (req, res) => res.status(200).send(games));
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'ignore' }));

const realtimeClients = new Set;
const games = [{
    name: "Uno",
    waiting: 3,
    running: 5
}, {
    name: "Chiure",
    waiting: 1,
    running: 2
}, {
    name: "Mystigri",
    waiting: 3,
    running: 5
}];

wss.on('connection', (ws, req) => {
    console.log(req.url);
    switch (req.url) {
        case '/realtime':
            realtimeClients.add(ws);
            ws.on('message', () => {
                ws.close(1006, 'Unauthorized');
            });
            break;
    }
});

server.listen(8888, () => {
    console.log('listening...');
});