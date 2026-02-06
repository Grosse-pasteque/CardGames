const s = new URLSearchParams(location.search);
const roomId = s.get('id');
const isHost = s.get('host') === "true";

let playerNicknames = [];

(async function() {
    const PayloadType = await jsonFetch('/enums/UnoPayloadType');

    const ws = new WebSocket(`ws://localhost:8888?id=${roomId}&nickname=${localStorage.nickname || ''}`);
    ws.onmessage = message => {
        const { type, data } = JSON.parse(message.data);
        switch (type) {
            // Self
            case PayloadType.RECEIVE_CARD: // deck and draw
                // card id
                break;

            // Broadcast
            // NOTE: would be better to send those offer HTTP in it fails
            case PayloadType.PLAYER_DISCARDED:
                // player index
                // card id
                break;
            case PayloadType.PLAYER_DREW:
                // player index
                break;

            // All
            case PayloadType.GAME_TURN: // whose turn is it
                // player index
                break;
            case PayloadType.GAME_STATUS: // on player join / leave
                // spectator count
                playerNicknames = data.players;
                let i = 1, content = '<table><tbody>';
                for (const nickname of playerNicknames)
                    content += `<tr><td>${i++}</td><td>${nickname}</td></tr>`;
                popup.innerHTML = content + '</tbody></table>';
                break;
            case PayloadType.GAME_STARTED: // when host starts
                start.hidden = true;
                break;
            case PayloadType.GAME_BEGIN: // when game begins
                // top card
                break;
            case PayloadType.GAME_SUMMARY: // end game
                // player index
                // points
                break;
        }
    };
    // ws.onclose = handleClose;
    ws.send = (type, data) => WebSocket.prototype.send.call(ws, JSON.stringify(data === undefined ? { type } : { type, data }));

    // put start button if client is host
    start.hidden = !isHost;
    start.addEventListener('click', () => {
        ws.send(PayloadType.HOST_START);
    });
})();


let popupVisible = false;
window.addEventListener('keyup', e => {
    if (e.key === 'Escape') {
        popup.style = popupVisible ? 'display:none' : '';
        popupVisible = !popupVisible;
        e.preventDefault();
    }
});


async function jsonFetch(...args) {
    const rk = await fetch(...args);
    return await rk.json();
}

const config = {
    handsDisplayCompact: false,
}

const hiddenHands = [];

const hiddenHandSlots = {
    left: document.getElementById('left-hands'),
    top: document.getElementById('top-hands'),
    right: document.getElementById('right-hands')
};
const playerElements = [];

function addDeck(cardsCount) {
    const playerElement = document.createElement('div');
    playerElement.className = 'hand';
    const nicknameDisplay = document.createElement('span');
    nicknameDisplay.innerText = "abc";
    const handElement = document.createElement('div');
    if (config.handsDisplayCompact) handElement.innerText = cardsCount;
    else for (let i = 0; i < cardsCount; i++) {
        const card = document.createElement('i');
        card.className = 'card';
        // card.innerText = '9';
        // if (value === 9 || value === 6) card.style.textDecoration = 'underline';
        handElement.appendChild(card);
    }
    playerElement.append(nicknameDisplay, handElement)
    playerElements.push(playerElement);

    const c = playerElements.length;
    let n = 0;
    while (c - 2 * n >= n) n++;
    n--;
    let i = 0;
    const m = c - 2 * n;
    for (let j = 0; j < n; j++)
        hiddenHandSlots.left.appendChild(playerElements[i++]);
    for (let j = 0; j < m; j++)
        hiddenHandSlots.top.appendChild(playerElements[i++]);
    for (let j = 0; j < n; j++)
        hiddenHandSlots.right.appendChild(playerElements[i++]);
}
/*
setTimeout(addDeck, 0, 6);
setTimeout(addDeck, 2000, 7);
setTimeout(addDeck, 2000, 11);
setTimeout(addDeck, 4000, 7);
setTimeout(addDeck, 4000, 9);
setTimeout(addDeck, 4000, 3);
*/
addDeck(6);
addDeck(7);
addDeck(11);
addDeck(7);
addDeck(9);
addDeck(3);

discard.onclick = async () => {
    const cards = Array.from(playerElements[Math.floor(Math.random() * playerElements.length)].lastElementChild.children);
    const card = cards[Math.floor(Math.random() * cards.length)];
    // const card = playerElements[4].children.item(0);
    const { left, top } = discard.getBoundingClientRect(); // in case window is resized
    moveFlipSwap(card, left, top, "url('./trans.png')");
}

function moveFlipSwap(el, x, y, newBg, duration = 1000) {
    const rect = el.getBoundingClientRect()
    const globalTarget = new DOMPoint(x, y)
    const globalCurrent = new DOMPoint(rect.left, rect.top)
    const style = getComputedStyle(el.parentElement.parentElement.parentElement);
    const comp = new DOMMatrix(style.transform);
    const rot = Math.atan2(comp.b, comp.a) * (180 / Math.PI);
    const inv = comp.inverse();

    const localTarget = inv.transformPoint(globalTarget)
    const localCurrent = inv.transformPoint(globalCurrent)

    let dx = localTarget.x - localCurrent.x;
    let dy = localTarget.y - localCurrent.y;
    if (rot === -90) {
        dx += 51;
        dy += 80;
    } else if (rot === 180) {
        dx -= 27;
        dy += 80;
    }

    const anim = el.animate(
        [
            { transform: 'translate(0px, 0px) rotateY(0deg)' },
            { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) rotateY(90deg) rotateX(${rot}deg) scale(1.25)` },
            { transformOrigin: 'top left', backgroundImage: newBg, transform: `translate(${dx}px, ${dy}px) rotateY(180deg) rotate(${rot}deg) scale(1.5)` }
        ],
        {
            duration,
            fill: 'forwards',
            easing: 'ease'
        }
    ).onfinish = () => el.parentElement.removeChild(el);

    return anim
}