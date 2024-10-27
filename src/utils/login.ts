import { ObjectId } from 'mongodb';
import Client, { IClient } from '../models/clients.ts'; // Предполагаем, что IClient определён в clients.ts
import Message from '../models/message.ts';
import { type WebSocket as WServ } from 'ws';
import mongoose from 'mongoose';

export const handleLogin = async (data: any, ws: WServ) => {
    const { userName: name, password } = data;
    console.log('proc login');
    
    // Получаем клиента и утверждаем тип
    const client = await Client.findOne({ name }) as IClient | null; // Предполагаем, что IClient - это интерфейс для Client
    console.log('client login is', client);
    
    if (!client || client.password !== password) {
        ws.send(JSON.stringify({ type: 'login', status: 'error', error: 'Invalid credentials' }));
        return new mongoose.Types.ObjectId();
    }
    console.log('login', client._id);
    ws.send(JSON.stringify({ type: 'login', status: 'ok', message: 'User logged in successfully', clientId: client._id.toString() }));
    return client._id; // Возвращаем ID клиента напрямую без new ObjectId
};