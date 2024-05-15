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
let deckP1 = [];
let deckP2 = [];
let deckTable = [];
let colors = ['red', 'yellow', 'green', 'blue'];

let bankP1 = 500;
let bankP2 = 500;
let bankRoll = 0;

colors.forEach(color => {
    for(let i = 0; i < 5; i++){
        deck.push({color, number: i});
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
            deckP1 = [];
            deckP2 = [];
            deckTable = [];
            playGame(room, id1, id2);
        } else {
            io.to(room).emit('roomStatus', 'waiting for player');
        }
    });
    socket.on('leave', (room) => {
        console.log('leave room: ' + room);
        socket.leave(room);
        io.to(room).emit('leave', room);
    });

    socket.on('fold', (room, id) => {
        console.log('Player ' + currentPlayer + ' fold');
    });
    
    socket.on('bet', (room, id, bet) => {
        console.log('Player ' + currentPlayer + ' bet ' + bet);
    });
    


    let currentPlayer = ''; // 1 pour joueur 1, 2 pour joueur 2

    function playGame(room, id1, id2){
        // Show flop and user card
        showFlop(room, id1, id2);

        currentPlayer = id1;
        console.log(id1, id2, currentPlayer);
        socket.on('playerAction', (room, id, action, price) => {
            console.log(id);
            console.log(currentPlayer);
            if(id == currentPlayer){
                console.log('Player ' + currentPlayer + ' ' + action);
            } else {
                console.log('Not your turn');
            }
        });
    }


})


server.listen(PORT, () => {
    console.log('Server ip : http://' +ip.address() +":" + PORT);
})



function showFlop(room){
    const roomClients = io.sockets.adapter.rooms.get(room);
    const clients = Array.from(roomClients);
    const id1 = clients[0];
    const id2 = clients[1];

    deck = deck.sort(() => Math.random() - 0.5);
    let card = "";
    
    card = deck.shift();
    deckP1.push(card);

    card = deck.shift();
    deckP2.push(card);

    for(let i = 0; i < 3; i++){
        card = deck.shift();
        deckTable.push(card);
    }

    io.to(id1).emit('flop', deckP1[0], deckTable);
    io.to(id2).emit('flop', deckP2[0], deckTable);
};