import mongoose from 'mongoose';
import Message from '../models/message.ts';
import { WebSocketServer, type WebSocket as WServ } from 'ws';

export const handleChatMessage = async (content: string, chatName: string, clients: Map<WServ, { clientId: mongoose.Types.ObjectId; sessionId: string }>, sender: WServ) => {
    
    const clientInfo = clients.get(sender);
    if (!clientInfo) {
        console.log('Client not found for sender');
        return;
    }
    const clientId = clientInfo.clientId;
    const newMessage = new Message({ content, chat: chatName, createdAt: new Date(), clientId });
    console.log('Processing chat message');
    try {
        await newMessage.save();
        clients.forEach((id, client) => {
            
            if (client.readyState === 1 && client !== sender) {
                client.send(JSON.stringify({
                    type: 'chat-message',
                    content,
                    chatName,
                    createdAt: new Date(),
                    clientId,
                }));
            }
        });
    } catch (e) {
        console.log('Error saving message:', e);
    }
};