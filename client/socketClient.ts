import { io } from 'socket.io-client';

const socket = io("http://localhost:3000/");


socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// ฟังก์ชันสำหรับส่งสัญญาณ
export const sendSignal = (data: any) => {
    socket.emit('signal', data);
};

// ฟังก์ชันสำหรับตั้งค่าการรับสัญญาณ
export const onSignal = (callback: (data: any) => void) => {
    socket.on('signal', callback);
};

// ส่งออก socket ถ้าต้องการ
export default socket;
