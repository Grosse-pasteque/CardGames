const PayloadType = require('./enums/PayloadType');
const defaultSettings = require('./data/defaultSettings');

const { broadcastRealtime } = require('./realtime');

let maxRoomId = 0;
const idToRoom = new Map;
const rooms = new Set;
const stats = {};


class Room {
    constructor(settings, gameId) {
        this.id = maxRoomId++;
        this.gameId = gameId;
        // FIXME: settings don't have verified values
        const defaultGameSettings = require(`./data/${gameId}/settings`);
        this.settings = {};
        for (const { name, type, attributes } of defaultSettings)
            this.setSetting(name, type, attributes, settings[name]);
        for (const { name, type, attributes } of defaultGameSettings)
            this.setSetting(name, type, attributes, settings[name]);
        this.clientId = 0;
        this.clients = new Set;
        this.handlers = {};
        rooms.add(this);
        idToRoom.set(this.id, this);
        stats[gameId].rooms++;
        updateGameStatus(gameId);
        updateRoomStatus(this);
    }
    setSetting(name, type, attributes, settingValue) {
        let d;
        switch (type) {
            case 'text':
            case 'radio':
                break;
            case 'checkbox':
                d = false;
                settingValue = settingValue === 'on';
                break;
            case 'number':
                settingValue = parseFloat(settingValue);
                break;
        }
        top: for (const { name, value } of attributes) switch (name) {
            case 'maxlength':
                if (settingValue.length > value) {
                    settingValue = d;
                    break top;
                }
                break;
            case 'value':
                d = value;
                if (type === 'number' && isNaN(settingValue)) {
                    settingValue = value;
                    break top;
                }
                break;
            case 'checked':
                d = true;
                break;
            case 'max':
                if (settingValue > value) {
                    settingValue = d;
                    break top;
                }
                break;
            case 'min':
                if (settingValue < value) {
                    settingValue = d;
                    break top;
                }
                break;
            case 'step':
                const m = 10 ** value.split('.')[1]?.length || 0;
                if (settingValue * m % (value * m)) {
                    settingValue = d;
                    break top;
                }
                break;
        }
        this.settings[name] = settingValue;
    }
    // NOTE: maybe would be better as a WebSocket method
    join(ws, code) {
        if (this.clients.size === this.settings.maxPlayers)
            return ws.close(1009, 'Room Full');
        if (!this.settings.public && this.settings.code !== code)
            return ws.close(1009, 'Wrong code');
        ws.id = this.clientId++;
        this.clients.add(ws);
        this.onJoin?.(ws);
        stats[this.gameId].players++;
        updateGameStatus(this.gameId);
        updateRoomStatus(this);
    }
    leave(ws) {
        if (!this.clients.delete(ws)) return;
        stats[this.gameId].players--;
        updateGameStatus(this.gameId);
        if (ws.id === 0) return this.destroy();
        this.onLeave?.(ws);
        updateRoomStatus(this);
    }
    destroy() {
        for (const ws of this.clients)
            ws.close(1009, 'Room Destroyed');
        rooms.delete(this);
        idToRoom.delete(this.id);
        this.onDestroy?.();
        stats[this.gameId].rooms--;
        updateGameStatus(this.gameId);
        deleteRoomStatus(this);
    }
    get url() {
        let s = `/games/${this.gameId}?id=${this.id}`;
        if (!this.settings.public)
            s += `&code=${encodeURIComponent(this.settings.code)}`;
        return s;
    }
    broadcast(data, excepted) {
        data = JSON.stringify(data);
        for (const ws of this.clients)
            if (excepted !== ws)
                ws.send(data);
    }
}

function updateRoomStatus(room) {
    if (room.settings.public) broadcastRealtime({
        type: PayloadType.ROOM_STATUS_UPDATE,
        data: getRoomStatus(room)
    });
}

function deleteRoomStatus(room) {
    if (room.settings.public) broadcastRealtime({
        type: PayloadType.ROOM_STATUS_DELETE,
        data: room.id
    });
}

function updateGameStatus(id) {
    broadcastRealtime({
        type: PayloadType.GAME_STATUS_UPDATE,
        data: stats[id]
    });
}

function getRoomStatus(room) {
    return {
        id: room.id,
        game: room.gameId,
        name: room.settings.name,
        players: room.clients.size
    }
}

module.exports = { Room, rooms, stats, idToRoom, getRoomStatus };