console.log('Loaded main');

const config = {
    handsDisplayCompact: false,
}

const hiddenHands = [];

const hiddenHandSlots = {
    left: document.getElementById('left-hands'),
    top: document.getElementById('top-hands'),
    right: document.getElementById('right-hands')
};
const handElements = [];

function addDeck(cardsCount) {
    const handElement = document.createElement('div');
    handElement.className = 'hand-hidden';
    if (config.handsDisplayCompact) handElement.innerText = cardsCount;
    else for (let i = 0; i < cardsCount; i++) {
        const card = document.createElement('i');
        card.className = 'card';
        handElement.appendChild(card);
    }
    handElements.push(handElement);

    const c = handElements.length;
    let n = 0;
    while (c - 2 * n >= n) n++;
    n--;
    let i = 0;
    const m = c - 2 * n;
    for (let j = 0; j < n; j++)
        hiddenHandSlots.left.appendChild(handElements[i++]);
    for (let j = 0; j < m; j++)
        hiddenHandSlots.top.appendChild(handElements[i++]);
    for (let j = 0; j < n; j++)
        hiddenHandSlots.right.appendChild(handElements[i++]);
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

const { left: TX, top: TY } = discard.getBoundingClientRect();
discard.onclick = () => {
    const cards = Array.from(handElements[Math.floor(Math.random() * handElements.length)].children);
    const card = cards[Math.floor(Math.random() * cards.length)];
    //const card = handElements[0].children.item(0);
    moveFlipSwap(card, TX, TY, "url('./trans.png')");
}


function getTransformToAncestorMatrix(el, ancestor = document.body) {
    let node = el
    let m = new DOMMatrix()
    while (node && node !== ancestor && node instanceof Element) {
        const style = getComputedStyle(node)
        const t = style.transform && style.transform !== 'none' ? new DOMMatrix(style.transform) : new DOMMatrix()
        m = t.multiply(m)
        node = node.parentElement
    }
    return m
}

function moveFlipSwap(el, x, y, newBg, duration = 1000) {
    const rect = el.getBoundingClientRect()
    const globalTarget = new DOMPoint(x, y)
    const globalCurrent = new DOMPoint(rect.left, rect.top)

    const m = getTransformToAncestorMatrix(el, document.body)
    const inv = m.inverse()

    const localTarget = inv.transformPoint(globalTarget)
    const localCurrent = inv.transformPoint(globalCurrent)

    const dx = localTarget.x - localCurrent.x
    const dy = localTarget.y - localCurrent.y

    const anim = el.animate(
        [
            { transform: 'translate(0px, 0px) rotateY(0deg)' },
            { transform: `translate(${dx}px, ${dy}px) rotateY(90deg)` },
            { backgroundImage: newBg, transform: `translate(${dx}px, ${dy}px) rotateY(180deg)` }
        ],
        {
            duration,
            fill: 'forwards',
            easing: 'ease'
        }
    ).onfinish = () => el.parentElement.removeChild(el);

    return anim
}
