import Client from '../models/clients.ts';
import Message from '../models/message.ts';
import { type WebSocket as WServ } from 'ws';

export const handleLogin = async (data: any, ws: WServ) => {
    const { userName: name, password } = data;
    console.log('proc login');
    // Логика для логина (например, проверка имени пользователя и пароля)
    const client = await Client.findOne({ name });
    console.log('client login is', client);
    if (!client || client.password !== password) {
        ws.send(JSON.stringify({ type: 'login', status: 'error', error: 'Invalid credentials' }));
        return;
    }

    ws.send(JSON.stringify({ type: 'login', status: 'ok', message: 'User logged in successfully' }));
};