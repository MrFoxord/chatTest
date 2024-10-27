import Client from "../models/clients.ts";
import Message from "../models/message.ts";
import { type WebSocket as WServ } from 'ws';

export const handleRegister = async (data: any, ws: WServ) => {
    const { userName: name, email, password } = data;
    const existingUser = await Client.findOne({ name });

    if (existingUser) {
        ws.send(JSON.stringify({ type: 'register', status: 'error', error: 'User already exists' }));
        return;
    }

    const newClient = new Client({ name, email, password });
    await newClient.save();

    ws.send(JSON.stringify({ type: 'register', status: 'ok', message: 'User registered successfully', clientId: newClient._id })); // Отправляем clientId
    
    try {
        const lastMessages = await Message.find().sort({ createdAt: -1 }).limit(20).exec();
        lastMessages.reverse(); 
        
        ws.send(JSON.stringify({
            type: 'history',
            messages: lastMessages.map(msg => ({
                content: msg.content,
                chatName: msg.chat,
                audioData: msg.audioData,
                clientId: msg.clientId 
            }))
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
};