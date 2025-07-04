const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5000;
const rooms = {}; // { roomId: { players: [socketId1, socketId2] } }

app.use(express.static('public'));

app.get('/create', (req, res) => {
  const roomId = uuidv4().slice(0, 6); // 짧은 방 코드
  rooms[roomId] = { players: [] };
  res.redirect(`/game.html?roomId=${roomId}`);
});

io.on('connection', (socket) => {
  console.log('🟢 유저 접속:', socket.id);

  socket.on('joinRoom', (roomId) => {
    if (!rooms[roomId]) {
      socket.emit('errorMessage', '❌ 방이 존재하지 않습니다.');
      return;
    }

    const room = rooms[roomId];
    if (room.players.length >= 2) {
      socket.emit('errorMessage', '❌ 방이 가득 찼습니다.');
      return;
    }

    room.players.push(socket.id);
    socket.join(roomId);
    console.log(`➡️ ${socket.id} 가 ${roomId} 방에 입장`);

    io.to(roomId).emit('playerCount', room.players.length);

    if (room.players.length === 2) {
      io.to(roomId).emit('startGame');
    }

    // 메시지 브로드캐스트 예시
    socket.on('gameMessage', (msg) => {
      socket.to(roomId).emit('gameMessage', msg);
    });

    // 방 나가기
    socket.on('leaveRoom', () => {
      leaveRoom(roomId, socket.id);
    });

    socket.on('disconnect', () => {
      console.log(`❌ ${socket.id} 연결 해제`);
      leaveRoom(roomId, socket.id, true);
    });
  });

  function leaveRoom(roomId, socketId, isDisconnect = false) {
    const room = rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(id => id !== socketId);

    if (room.players.length === 1 && isDisconnect) {
      const remaining = room.players[0];
      io.to(remaining).emit('hostDisconnected');
    }

    if (room.players.length === 0) {
      delete rooms[roomId];
      console.log(`🗑 ${roomId} 방 삭제`);
    } else {
      io.to(roomId).emit('playerCount', room.players.length);
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  //console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  // 노트북 VMware window10 IPv4 사용중
  console.log(`🚀 서버 실행 중: http://192.168.0.165:${PORT}`);
});
