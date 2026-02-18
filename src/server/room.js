const State = require('./enums/State');
const PayloadType = require('./enums/PayloadType');
const DefaultConfig = {
    name: "Room",
    public: State.ON,
    code: "",
    maxPlayers: 100
};

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
        this.settings = Object.assign(DefaultConfig, require(`./data/${gameId}/settings`), settings);
        this.clientId = 0;
        this.clients = new Set;
        this.handlers = {};
        rooms.add(this);
        idToRoom.set(this.id, this);
        stats[gameId].rooms++;
        updateGameStatus(gameId);
        updateRoomStatus(this);
    }
    // NOTE: maybe would be better as a WebSocket method
    join(ws, code) {
        if (this.clients.size === this.settings.maxPlayers)
            return ws.close(1009, 'Room Full');
        if (this.settings.public === State.OFF && this.settings.code !== code)
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
        if (this.settings.public === State.OFF)
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
    if (room.settings.public === State.ON) broadcastRealtime({
        type: PayloadType.ROOM_STATUS_UPDATE,
        data: getRoomStatus(room)
    });
}

function deleteRoomStatus(room) {
    if (room.settings.public === State.ON) broadcastRealtime({
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

module.exports = { Room, rooms, stats, idToRoom, DefaultConfig, getRoomStatus, updateRoomStatus, deleteRoomStatus };