const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const session = require("express-session");
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
}));

let players = {};
let drawnNumbers = [];
const adminPassword = "admin123"; // Change this to your desired admin password
let gameStarted = false;
let gamePaused = false;

const matrix = [
    [
        [19, 28, 46, 68, 75],
        [5, 26, 39, 58, 78],
        [14, 37, 50, 69, 84],
        [3, 25, 57, 60, 86],
        [16, 31, 49, 77, 89],
        [8, 17, 48, 59, 79],
        [15, 20, 44, 52, 70],
        [4, 33, 41, 61, 83],
        [9, 29, 30, 62, 88]
    ],
    [
        [18, 22, 55, 76, 87],
        [12, 38, 40, 66, 82],
        [1, 27, 42, 73, 85],
        [10, 34, 56, 63, 80],
        [6, 35, 43, 64, 71],
        [13, 21, 54, 74, 90],
        [7, 24, 32, 53, 67],
        [2, 36, 47, 65, 72],
        [11, 23, 45, 51, 81]
    ],
    [
        [19, 32, 58, 64, 84],
        [13, 20, 48, 55, 77],
        [2, 21, 46, 75, 82],
        [6, 18, 39, 62, 70],
        [25, 41, 59, 74, 83],
        [17, 38, 44, 60, 86],
        [8, 22, 47, 66, 72],
        [9, 12, 37, 42, 88],
        [15, 36, 51, 68, 90]
    ],
    [
        [5, 29, 30, 56, 80],
        [10, 35, 54, 63, 81],
        [4, 26, 45, 61, 79],
        [3, 14, 43, 50, 71],
        [7, 23, 31, 52, 73],
        [11, 28, 49, 69, 89],
        [24, 34, 53, 67, 85],
        [27, 40, 57, 76, 87],
        [1, 16, 33, 65, 78]
    ],
    [
        [15, 24, 44, 64, 79],
        [4, 29, 30, 51, 76],
        [17, 32, 53, 63, 80],
        [7, 23, 56, 61, 85],
        [11, 34, 42, 72, 87],
        [3, 13, 45, 54, 74],
        [16, 21, 43, 58, 78],
        [6, 37, 40, 65, 82],
        [2, 22, 39, 67, 83]
    ],
    [
        [14, 28, 50, 75, 90],
        [19, 31, 49, 68, 81],
        [5, 20, 47, 77, 84],
        [12, 38, 55, 69, 89],
        [1, 36, 41, 66, 71],
        [18, 26, 57, 70, 88],
        [8, 25, 33, 52, 62],
        [9, 35, 46, 60, 73],
        [10, 27, 48, 59, 86]
    ],
    [
        [12, 34, 40, 75, 89],
        [8, 16, 42, 55, 77],
        [5, 24, 33, 67, 83],
        [14, 27, 51, 78, 84],
        [18, 38, 46, 63, 81],
        [9, 47, 66, 79, 86],
        [4, 28, 31, 57, 72],
        [17, 36, 52, 64, 80],
        [19, 23, 45, 62, 74]
    ],
    [
        [3, 15, 32, 60, 71],
        [10, 20, 43, 54, 85],
        [2, 26, 35, 59, 76],
        [6, 39, 49, 68, 73],
        [13, 29, 48, 50, 88],
        [22, 30, 53, 65, 82],
        [1, 25, 58, 69, 90],
        [7, 21, 41, 56, 87],
        [11, 37, 44, 61, 70]
    ],
    [
        [7, 16, 32, 66, 73],
        [18, 29, 46, 55, 88],
        [2, 23, 34, 50, 75],
        [4, 30, 40, 61, 78],
        [10, 27, 41, 56, 86],
        [20, 39, 59, 60, 83],
        [9, 24, 51, 64, 81],
        [3, 28, 48, 53, 80],
        [17, 37, 45, 63, 77]
    ],
    [
        [19, 35, 49, 71, 85],
        [8, 14, 47, 54, 74],
        [6, 25, 36, 62, 84],
        [15, 22, 58, 70, 89],
        [12, 31, 43, 68, 90],
        [1, 42, 65, 72, 87],
        [5, 21, 38, 52, 76],
        [13, 33, 57, 67, 82],
        [11, 26, 44, 69, 79]
    ],
    [
        [16, 28, 45, 68, 87],
        [4, 29, 35, 55, 73],
        [9, 30, 54, 62, 88],
        [1, 21, 33, 52, 76],
        [8, 40, 50, 79, 81],
        [11, 20, 46, 63, 83],
        [27, 49, 59, 72, 80],
        [2, 19, 32, 48, 67],
        [14, 22, 57, 78, 90]
    ],
    [
        [6, 18, 47, 69, 86],
        [13, 31, 44, 61, 70],
        [7, 24, 34, 56, 71],
        [5, 23, 41, 65, 74],
        [10, 37, 53, 60, 89],
        [17, 38, 42, 75, 84],
        [15, 25, 51, 77, 85],
        [12, 36, 43, 64, 82],
        [3, 26, 39, 58, 66]
    ],
    [
        [13, 22, 41, 61, 86],
        [3, 24, 34, 52, 71],
        [1, 35, 56, 64, 83],
        [7, 23, 36, 53, 75],
        [5, 48, 59, 72, 84],
        [14, 28, 42, 60, 87],
        [26, 47, 50, 79, 89],
        [4, 10, 30, 49, 66],
        [15, 25, 51, 76, 81]
    ],
    [
        [9, 16, 46, 65, 80],
        [11, 32, 45, 68, 78],
        [8, 21, 33, 57, 73],
        [6, 20, 43, 63, 77],
        [12, 31, 54, 62, 85],
        [19, 39, 40, 70, 82],
        [18, 29, 58, 74, 90],
        [17, 38, 44, 69, 88],
        [2, 27, 37, 55, 67]
    ],
    [
        [11, 35, 59, 68, 80],
        [17, 24, 42, 57, 76],
        [1, 27, 48, 79, 81],
        [7, 16, 31, 65, 77],
        [23, 44, 50, 71, 85],
        [14, 37, 49, 63, 88],
        [3, 20, 46, 67, 73],
        [8, 12, 34, 45, 87],
        [19, 39, 55, 60, 89]
    ],
    [
        [9, 25, 38, 53, 86],
        [15, 36, 51, 64, 90],
        [2, 28, 47, 66, 78],
        [5, 10, 41, 56, 72],
        [4, 22, 33, 54, 74],
        [13, 26, 40, 61, 82],
        [29, 30, 58, 62, 83],
        [21, 43, 52, 75, 84],
        [6, 18, 32, 69, 70]
    ]
];


io.on("connection", (socket) => {
    console.log("Người chơi kết nối:", socket.id);

    // Handle session
    const sessionId = socket.handshake.query.sessionId || uuidv4();
    socket.sessionId = sessionId;
    socket.emit("session", sessionId);

    // Reassign socket ID to existing player if session ID matches
    for (let imageId in players) {
        if (players[imageId].sessionId === sessionId) {
            players[imageId].socketId = socket.id;
        }
    }

    // Send current state to the newly connected user
    socket.emit("updatePlayers", players);
    socket.emit("updateAvailableImages", Object.keys(players));

    socket.on("chooseImage", (imageId, playerName) => {
        if (!gameStarted) {
            if (!players[imageId]) {
                players[imageId] = { playerName: playerName, sessionId: sessionId, socketId: socket.id, matrix: matrix[imageId-1] };
                io.emit("imageChosen", imageId, playerName);
                io.emit("updatePlayers", players);
                io.emit("updateAvailableImages", Object.keys(players));
            } else {
                socket.emit("error", "Ảnh này đã được chọn bởi người chơi khác.");
            }
        } else {
            socket.emit("error", "Không thể chọn ảnh khi trò chơi đã bắt đầu.");
        }
    });

    socket.on("startGame", () => {
        if (!gameStarted && Object.keys(players).length > 0) {
            gameStarted = true;
            gamePaused = false;
            drawNumber();
        } else if (gamePaused) {
            gamePaused = false;
            drawNumber();
        } else {
            socket.emit("error", "Trò chơi đã bắt đầu hoặc không có người chơi.");
        }
    });

    socket.on("stopGame", () => {
        if (gameStarted) {
            gamePaused = true;
        } else {
            socket.emit("error", "Trò chơi chưa bắt đầu.");
        }
    });

    socket.on("drawNumber", () => {
        if (gameStarted && !gamePaused) {
            let number = Math.floor(Math.random() * 90) + 1;
            drawnNumbers.push(number);
            io.emit("numberDrawn", number, drawnNumbers);
            checkForWinner();
        } else {
            socket.emit("error", "Trò chơi chưa bắt đầu hoặc đang tạm dừng.");
        }
    });

    // Reset game
    socket.on("resetGame", (password) => {
        if (password === adminPassword) {
            players = {};
            drawnNumbers = [];
            gameStarted = false;
            gamePaused = false;
            io.emit("gameReset");
            io.emit("updateAvailableImages", []);
        }
    });

    socket.on("disconnect", () => {
        for (let imageId in players) {
            if (players[imageId].socketId === socket.id) {
                delete players[imageId];
                break;
            }
        }
        io.emit("updatePlayers", players);
        io.emit("updateAvailableImages", Object.keys(players));
        console.log("Người chơi ngắt kết nối:", socket.id);
    });
});


function checkForWinner() {
    for (let playerId in players) {
        let player = players[playerId];
        let matrix = player.matrix;
        for (let row of matrix) {
            if (row.every(num => drawnNumbers.includes(num))) {
                io.emit("winner", player.playerName); 
                io.emit("winningNumbers", row);
                gameStarted = false;
                gamePaused = true;
                return; 
            }
        }
    }
}


function drawNumber() {
    if (gameStarted && !gamePaused) {
        if (drawnNumbers.length === 99) {
            console.log("Đã rút hết 99 số");
            return;
        }

        let number;
        do {
            number = Math.floor(Math.random() * 90) + 1;
        } while (drawnNumbers.includes(number)); 

        drawnNumbers.push(number);
        io.emit("numberDrawn", number, drawnNumbers);
        checkForWinner();
        setTimeout(drawNumber, 5000); 
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
