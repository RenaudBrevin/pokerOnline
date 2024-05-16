import express from 'express';
import http from 'http';
import ip from 'ip';
import { Server } from 'socket.io';
import cors from 'cors';
const app = express();
const server = http.createServer(app);
const PORT = 3000;
const io = new Server(server, {
    cors: {
        origin: '*',
        }
})
app.use(cors())
app.get('/', (req, res) => {
    res.json('ip address: http://' + ip.address()+':'+PORT);    
});

let deck = [];
let colors = ['C', 'D', 'H', 'S'];

let table = {
    players: [],
    deck: [],
    bank: 0,
    nextBet: 50,
    actualBet: 0,
    actualTurn: 'preFlop'
}

let player1 = {
    name: 'Player 1',
    id: '',
    deck: [],
    bank: 500,
    bet: 0,
    isTurn: false
}

let player2 = {
    name: 'Player 2',
    id: '',
    deck: [],
    bank: 500,
    bet: 0,
    isTurn: false
}

colors.forEach(color => {
    for(let i = 1; i < 14; i++){
        let j = i;
        let index = 0;
        if(i > 10){
            index = i - 11;
            j = ['J', 'Q', 'K'][index];
        } else if(i === 1){
            j = 'A';
        }
        deck.push({color, number: j});
    }
})


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.broadcast.emit('user connected');
    
    // Envoyer l'ID du socket au client lorsqu'il se connecte
    socket.emit('socketID', socket.id);

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.broadcast.emit('user disconnected');
    });

    socket.on('message', (room, msg) => {
        console.log('message: ' + msg);
        io.emit('message', {room, msg});
    });
    
    socket.on('room', (room, msg) => {
        console.log('room: ' + room + ' message: ' + msg);
        io.to(room).emit('message', msg);
    });

    socket.on('join', (room) => {
        console.log('join room: ' + room);
        socket.join(room);
        io.to(room).emit('join', room);

        //start game when 2 players join    
        console.log(io.sockets.adapter.rooms.get(room));
        const roomClients = io.sockets.adapter.rooms.get(room);
        const clients = Array.from(roomClients);
        const id1 = clients[0];
        const id2 = clients[1];

        if(roomClients.size === 2){
            io.to(room).emit('roomStatus', 'Start game');
            player1.id = id1;
            player2.id = id2;
            table.players = [player1, player2];

            // Reset deck, player deck and table deck and bank players
            table.deck = [];
            player1.deck = [];
            player2.deck = [];
            table.bank = 0;
            table.nextBet = 50;
            player1.bank = 500;
            player2.bank = 500;


            showFlop(room);
        } else {
            io.to(room).emit('roomStatus', 'waiting for player');
        }
    });
    socket.on('leave', (room) => {
        console.log('leave room: ' + room);
        socket.leave(room);
        io.to(room).emit('leave', room);
    });




    // Play turn
    socket.on('playerAction', (room, userId, action) => {
        // Get user by ID
        let user = userId === player1.id ? player1 : player2;
        let otherPlayer = table.players.find(player => player.id !== user.id);
        let bet = table.nextBet;
        if(user.isTurn){
            if(action === 'bet'){
                user.bank -= bet;
                table.bank += bet;

                user.bet = bet;

                table.nextBet = bet + 50;

                changeturn(user, otherPlayer);

                io.to(room).emit('acceptAction', user.id, action, table);
                io.to(otherPlayer.id).emit('noCheck');

                console.log('bet')
            } else if(action === 'fold'){
                otherPlayer.bank += table.bank;
                table.bank = 0;

                changeturn(user, otherPlayer);

                io.to(room).emit('acceptAction', user.id, action, table);

                console.log('fold')
            } else if(action === 'check'){
                user.bet = -1;
                
                changeturn(user, otherPlayer);
                
                io.to(room).emit('acceptAction', user.id, action, table);

                console.log('check')

                console.log(user.bet + ' ' + otherPlayer.bet)
                if(user.bet === otherPlayer.bet){
                    nextCard(room);
                }

            } else if(action === 'call'){
                user.bank -= otherPlayer.bet;
                table.bank += otherPlayer.bet;

                changeturn(user, otherPlayer);

                io.to(room).emit('acceptAction', user.id, action, table);
                
                console.log('call')

                nextCard(room);
            }
        } else {
            console.log('Not your turn ' + user.isTurn + otherPlayer.isTurn);
        }
    });
})

function changeturn(player, otherPlayer){
    player.isTurn = false;
    otherPlayer.isTurn = true;
}


server.listen(PORT, () => {
    console.log('Server ip : http://' +ip.address() +":" + PORT);
})



function showFlop(room){
    const roomClients = io.sockets.adapter.rooms.get(room);
    const clients = Array.from(roomClients);
    const id1 = clients[0];
    const id2 = clients[1];

    table.actualTurn = 'Flop';

    deck = deck.sort(() => Math.random() - 0.5);
    let card = "";
    
    card = deck.shift();
    player1.deck.push(card);

    card = deck.shift();
    player2.deck.push(card);

    for(let i = 0; i < 3; i++){
        card = deck.shift();
        table.deck.push(card);
    }

    player1.isTurn = true;

    io.to(id1).emit('flop', player1.deck[0], table);
    io.to(id2).emit('flop', player2.deck[0], table);
};


function nextCard(room){
    //Reset bet
    table.players.forEach(player => {
        player.bet = 0;
    });
    table.actualBet = 0;
    table.nextBet = 50;
    

    if(table.actualTurn === 'Flop'){
        table.actualTurn = 'Turn';
        let card = deck.shift();
        table.deck.push(card);
        io.to(room).emit('turn', table);
    } else if(table.actualTurn === 'Turn'){
        table.actualTurn = 'River';
        let card = deck.shift();
        table.deck.push(card);
        io.to(room).emit('river', table);
    } else if(table.actualTurn === 'River'){
        table.actualTurn = 'Showdown';
        io.to(room).emit('showdown', table);
    }
}