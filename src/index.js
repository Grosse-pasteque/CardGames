/*
- pile + melangée
- 
// value , couleur , type

// NUMBERS + plus2 + skips + changeDir
const CARDS = Array((10 + 2 + 2 + 2) * 4 )
const pile = CARDS.shuffle()
*/

// { type, value, color }

let ID = [];

const CardType = {
    NUMBER: 0,
    PLUS_TWO: 1,
    SKIPS: 2,
    CHANGE_DIRECTION: 3,
    JOKER: 4,
    PLUS_FOUR: 5
};
const CardColor = {
    RED: 0,
    YELLOW: 1,
    GREEN: 2,
    BLUE: 3,
    BLACK: 4
};

function number(value, color) {
    return { type: CardType.NUMBER, value, color };
}

class Game {
    constructor(players) {
        this.players = players; // { nickname, hand }
        this.pioche = [];
        this.turn = 0;
        this.direction = 1; // -1
        this.currentCard = null;
        this.reset();
    }
    start() {
        // distribuer
        for (let player in this.players) {
            while (player.hand.length < 7) {
                player.hand.push(this.pioche.pop());
            }
        }
        this.currentCard = this.pioche.pop();
    }
    reset() {
        const deck = [];
        for (const color of [CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE]) {
            deck.push(number(0, color));
            for (let value = 1; value <= 9; value++)
                deck.push(number(value, color), number(value, color));
            for (const type of [CardType.PLUS_TWO, CardType.SKIPS, CardType.CHANGE_DIRECTION])
                deck.push({ type, value: 20, color }, { type, value: 20, color });
        }
        for (let i = 0; i < 4; i++)
            deck.push({ type: CardType.JOKER, value: 50, color: CardColor.BLACK }, { type: CardType.PLUS_FOUR, value: 50, color: CardColor.BLACK });
        
        while (deck.length)
            this.pioche.push(deck.splice(Math.floor(Math.random() * deck.length), 1));
    }
    play(player, card) {
        // redefini currentCard in function of what this player plays
        if (
            this.currentCard.type === card.type ||
            this.currentCard.value === card.value ||
            this.currentCard.color === card.color ||
            card.type === CardType.JOKER || card.type === CardType.PLUS_FOUR
        ) {
            const nextPlayer = this.players[this.turn + 1]; // c'est pas [this.turn += this.direction] ici aussi?
            switch (card.type) {
                // parce que je les entends parler en chinois
                case CardType.PLUS_TWO:
                    if (!nextPlayer.hand.some(card => card.type === CardType.PLUS_TWO || card.type === CardType.JOKER)) {
                        nextPlayer.hand.push(this.pioche.pop(), this.pioche.pop());
                        this.turn += this.direction;
                    }
                    break;
                case CardType.PLUS_FOUR:
                    if (!nextPlayer.hand.some(card => card.type === CardType.PLUS_FOUR)) {
                        nextPlayer.hand.push(this.pioche.pop(), this.pioche.pop(), this.pioche.pop(), this.pioche.pop());
                        this.turn += this.direction;
                    }
                    break;
                case CardType.SKIPS:
                    this.turn += this.direction;
                    break;
                case CardType.CHANGE_DIRECTION:
                    if (this.direction > 0) {
                        this.direction = -1   
                    } else {
                        this.direction = 1
                    }
                    // Boomer: this.direction = 2 - this.direction;
                    break;
            }
            this.turn += this.direction;
        }
        // remove card from player's deck
        // +1 to turn
    }
}