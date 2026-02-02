console.log('Loaded main');

let games;
const gameItems = {};
const realtime = new WebSocket('ws://localhost:8888/realtime');
realtime.onmessage = message => updateGameItem(JSON.parse(message.data));

(async () => {
    const rk = await fetch('http://localhost:8888/games');
    games = await rk.json();
    games.forEach(updateGameItem);
    list.addEventListener('click', e => {
        if (e.target.tagName !== 'DIV') return;
        location.href = location.origin + '/make/' + e.target.dataset.id;
        /*
        if (e.target.classList.toggle('expand')) {
            updateGameDetails(e.target.dataset.id);
            e.target.appendChild(gameDetails)
        }
        */
    })
})();

function updateGameItem(game) {
    const item = (gameItems[game.id] ||= list.appendChild(document.createElement('div')));
    item.dataset.id = game.id;
    item.innerHTML = `<b>${game.name}</b><br>Queue: ${game.waiting}<br>Games: ${game.running}`;
}

// <div style="float: right;"><button>Create</button><br><br><button>Queue</button></div>