import { io } from 'socket.io-client';

console.log('Testing WebSocket connection to http://localhost:8002...');

const socket = io('http://localhost:8002', {
  transports: ['websocket'],
  timeout: 5000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully');
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ WebSocket connection failed:', error.message);
  process.exit(1);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏰ Connection timeout');
  process.exit(1);
}, 5000);
