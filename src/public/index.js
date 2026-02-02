console.log('Loaded main');

(async () => {
    const realtime = new WebSocket('ws://localhost:8888/realtime');
    const rk = await fetch('http://localhost:8888/games');
    const games = await rk.json();
    for (const game of games) {
        list.innerHTML += `
<div>
    <b>${game.name}</b>
    <br>
    Queue: ${game.waiting}
    <br>
    Games: ${game.running}
</div>`;
    }
})();