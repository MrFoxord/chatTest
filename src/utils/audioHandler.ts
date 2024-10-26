import mongoose from 'mongoose';
import Message from '../models/message.ts';
import { type WebSocket as WServ } from 'ws';

export const handleAudioMessage = async (audioData: string, chatName: string, clients: Map<WServ, { clientId: mongoose.Types.ObjectId; sessionId: string }>, sender: WServ) => {
    const clientInfo = clients.get(sender);
    if (!clientInfo) {
        console.log('Client not found for sender');
        return;
    }
    const clientId = clientInfo.clientId;
    const newMessage = new Message({ audioData, chat: chatName, createdAt: new Date(), clientId });
    console.log('Processing audio message');
    try {
        await newMessage.save();
        console.log('Audio saved successfully');
        clients.forEach((id, client) => {
            if (client.readyState === 1 && client !== sender) {
                client.send(JSON.stringify({
                    type: 'audio-message',
                    audioData,
                    chatName,
                    createdAt: newMessage.createdAt,
                    clientId,
                }));
            }
        });
    } catch (e) {
        console.log('Error saving audio message:', e);
    }
};