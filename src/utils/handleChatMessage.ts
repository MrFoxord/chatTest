import Message from '../models/message.ts';
import { WebSocketServer, type WebSocket as WServ } from 'ws';

export const handleChatMessage = async (content: string, chatName: string, wss: WebSocketServer) => {
    const newMessage = new Message({ content, chat: chatName });
    console.log('proc handle chat message');
    try {
        await newMessage.save();
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({ type: 'chat-message', content, chatName }));
            }
        });
    } catch (e) {
        console.log('Error saving message', e);
    }
};

export const handleDisconnect = (ws: WServ) => {
    console.log('Client disconnected');
};