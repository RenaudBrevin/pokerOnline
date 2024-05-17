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

socket.on('preFlop', (userDeck, table) => {
    updateInfo(table);

    let playerContainer = document.querySelector('.cardPlayerContainer');

    console.log(playerContainer);

    let cardIndex = 0;
    for (let i = 0; i < 2; i++) {
        let myCard = document.createElement('div');
        myCard.classList.add('card', 'cardPlayer');
        
        playerContainer.appendChild(myCard);

        myCard.innerHTML = userDeck[cardIndex].number;
        myCard.classList.add(userDeck[cardIndex].color);
        cardIndex++;
    }
})


socket.on('flop', (table) => {
    let flop = table.deck;

    updateInfo(table);


    let flopContainer = document.querySelector('.containerCard .flop')
    for(let i = 0; i < flop.length; i++){
        let card = document.createElement('div');
        card.innerHTML = flop[i].number;
        card.classList.add('card', flop[i].color);
        flopContainer.appendChild(card);
    }
});

socket.on('turn', (table) => {
    let turn = table.deck[table.deck.length - 1]

    updateInfo(table);

    let turnContainer = document.querySelector('.containerCard .turn')
    let card = document.createElement('div');
    card.innerHTML = turn.number;
    card.classList.add('card', turn.color);
    turnContainer.appendChild(card);
});

socket.on('river', (table) => {
    let river = table.deck[table.deck.length - 1]

    updateInfo(table);

    let riverContainer = document.querySelector('.containerCard .river')
    let card = document.createElement('div');
    card.innerHTML = river.number;
    card.classList.add('card', river.color);
    riverContainer.appendChild(card);
});

socket.on('showdown', (winner) => {
    console.log('Winner:', winner);
});


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
    document.getElementById('callButton').disabled = false;
});

socket.on('noCall', () => {
    console.log('Opponent has check, you can\'t call');
    document.getElementById('callButton').disabled = true;
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

    if(player.bet === -1 || player.bet === 0){
        document.querySelector('#callButton').disabled = true;
    }
}

function updateInfo(table){
    player = table.players.find(player => player.id === userId);
    opponent = table.players.find(player => player.id !== userId);

    document.querySelector('.opponent .name').innerText = opponent.name + ' : ';
    document.querySelector('.opponent .bankRoll').innerText = opponent.bank;

    document.querySelector('.player .name').innerText = player.name + ' (You) : ';
    document.querySelector('.player .bankRoll').innerText = player.bank;

    document.querySelector('.table .bankRoll').innerText = "Pot : " + table.bank;

    document.querySelector('#betButton').textContent = 'Bet ' + table.nextBet;
    if(player.bet === -1 || player.bet === 0){
        document.querySelector('#callButton').textContent = 'Call';
    } else{
        document.querySelector('#callButton').textContent = 'Call ' + opponent.bet;
    }

    if(player.isTurn){
        ableButtons();
    }else{
        disabledButtons();
    }
}

function deleteAllCards(){
    document.querySelector('.cardPlayerContainer').innerHTML = '';
    document.querySelector('.flop').innerHTML = '';
    document.querySelector('.turn').innerHTML = '';
    document.querySelector('.river').innerHTML = '';
}



socket.on('newGame', (table) => {
    deleteAllCards();
    updateInfo(table);
});