let i = 0;
let room = '';
let socketid = '';
let userId = '';
const text = document.querySelector('textarea');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected');
});

socket.on('socketID', (id) => {
    console.log('Socket ID:', id);
    userId = id;
});

socket.on('message', (data) => {
    if(data.room == room){
        console.log(data);
        document.querySelector('.data').innerText = data.msg;
    }
});
socket.on('disconnect', () => {
    console.log('Disconnected');
});

let send = () => {
    i++;
    socket.emit('message', room, text.number);
    socket.emit('room', room, text.number);
}

let join = (roomNumber) => {
    socket.emit('leave', room);
    room = roomNumber;
    socket.emit('join', room);
}

socket.on('roomStatus', (data) => {
    console.log(data);
});

socket.on('flop', (userDeck, table) => {
    let flop = table.deck;
    console.log(userDeck);
    console.log(table.deck);

    updateInfo(table);

    let myCard = document.querySelector('.card');
    myCard.innerHTML = userDeck.number + userDeck.color;
    myCard.style.background = userDeck.color;

    let flopContainer = document.querySelector('.containerCard .flop')
    for(let i = 0; i < flop.length; i++){
        let card = document.createElement('div');
        card.innerHTML = flop[i].number + flop[i].color;
        card.classList.add('card');
        card.style.background = flop[i].color;
        flopContainer.appendChild(card);
    }
});

socket.on('turn', (table) => {
    let turn = table.deck[table.deck.length - 1]

    updateInfo(table);

    let turnContainer = document.querySelector('.containerCard .turn')
    let card = document.createElement('div');
    card.innerHTML = turn.number + turn.color;
    card.classList.add('card');
    card.style.background = turn.color;
    turnContainer.appendChild(card);
});

socket.on('river', (table) => {
    let river = table.deck[table.deck.length - 1]

    updateInfo(table);

    let riverContainer = document.querySelector('.containerCard .river')
    let card = document.createElement('div');
    card.innerHTML = river.number + river.color;
    card.classList.add('card');
    card.style.background = river.color;
    riverContainer.appendChild(card);
});

socket.on('showdown', (table) => {
    let winner = determineWinner(table.players, table.deck);
    console.log('Winner:', winner);

});

function determineWinner(players, tableDeck) {
let winner = null;
let highestHand = null;

console.log(players);

// Déclaration des tableaux pour les mains de chaque joueur
let handP1 = players[0].deck.concat(tableDeck);
let handP2 = players[1].deck.concat(tableDeck);

// Convertir les cartes de chaque main en format 'numéroCouleur'
const convertedHands = [handP1, handP2].map(hand => {
    return hand.map(card => {
        const number = card.number === 'J' ? 'J' : card.number.toString();
        return number + card.color;
    });
});

// Affichage des mains converties dans la console
console.log(convertedHands);

var hand1 = Hand.solve(convertedHands[0]);
var hand2 = Hand.solve(convertedHands[1]);
var winnerHand = Hand.winners([hand1, hand2]);

console.log(winnerHand);

return winner;
}



let fold = () => {
    socket.emit('playerAction', room, userId, 'fold');
};

let bet = () => {
    socket.emit('playerAction', room, userId, 'bet');
};

let check = () => {
    socket.emit('playerAction', room, userId, 'check');
};

let call = () => {
    socket.emit('playerAction', room, userId, 'call');
};

socket.on('acceptAction', (userId, action, table) => {
    console.log(userId, action, table.bank);
    updateInfo(table);
});

socket.on('noCheck', () => {
    console.log('Opponent has bet, you can\'t check');
    document.getElementById('checkButton').disabled = true;
});


function disabledButtons(){
    document.getElementById('foldButton').disabled = true;
    document.getElementById('betButton').disabled = true;
    document.getElementById('checkButton').disabled = true;
    document.getElementById('callButton').disabled = true;
}

function ableButtons(){
    document.getElementById('foldButton').disabled = false;
    document.getElementById('betButton').disabled = false;
    document.getElementById('checkButton').disabled = false;
    document.getElementById('callButton').disabled = false;
}

function updateInfo(table){
    player = table.players.find(player => player.id === userId);
    opponent = table.players.find(player => player.id !== userId);

    document.querySelector('.opponent .name').innerText = opponent.name;
    document.querySelector('.opponent .bankRoll').innerText = opponent.bank;

    document.querySelector('.player .name').innerText = player.name;
    document.querySelector('.player .bankRoll').innerText = player.bank;

    document.querySelector('.table .bankRoll').innerText = table.bank;

    document.querySelector('.nextBet').innerText = 'Next bet : ' + table.nextBet;

    if(player.isTurn){
        ableButtons();
    }else{
        disabledButtons();
    }
}