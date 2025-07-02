const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');
const statusEl = document.getElementById('status');

if (!roomId) {
  statusEl.innerText = '잘못된 접근입니다.';
  throw new Error('roomId가 없습니다.');
}

// 초대 링크 표시
const inviteInput = document.getElementById('inviteLink');
if (inviteInput) inviteInput.value = window.location.href;

// 서버에 방 참가 요청
socket.emit('joinRoom', roomId);

// 접속 플레이어 수 표시
socket.on('playerCount', (count) => {
  statusEl.innerText = `현재 접속한 플레이어 수: ${count}`;
});

// 게임 시작
socket.on('startGame', () => {
  statusEl.innerText = '🎮 게임이 시작되었습니다!';
  // 여기서부터 실제 게임 로직으로 확장 가능
  socket.emit('gameMessage', '안녕하세요! 게임 시작합니다.');
});

// 양방향 메시지 예시
socket.on('gameMessage', (msg) => {
  const p = document.createElement('p');
  p.innerText = `📩 ${msg}`;
  document.body.appendChild(p);
});

// 호스트 종료 알림
socket.on('hostDisconnected', () => {
  statusEl.innerText = '⚠️ 호스트가 게임을 종료했습니다.';
  socket.disconnect();
  setTimeout(() => {
    window.location.href = '/';
  }, 3000);
});

// 방 없거나 오류
socket.on('errorMessage', (msg) => {
  alert(msg);
  window.location.href = '/';
});

// 나가기 버튼
function leaveRoom() {
  socket.emit('leaveRoom', roomId);
  socket.disconnect();
  window.location.href = '/';
}
