import { WebSocketServer, type WebSocket as WServ } from 'ws';
import mongoose, {ObjectId} from 'mongoose';
import { 
    handleChatMessage,
    getChatHistory,
    handleDisconnect,
    handleLogin,
    handleRegister,
    handleAudioMessage,
    createCollectionIfNotExists,  
} from '../utils/index.ts';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

interface MessagePayload {
    type: string;
    clientId: string;
    content?: string;
    chatName: string;
    audioData?: string;
    duration?: number;
    sessionId?: string;
}

dotenv.config();

const mongoURI = process.env.NEXT_PUBLIC_MONGODB_URI || 'mongodb://localhost:27017/chatDatabase';

mongoose.connect(mongoURI, {})
    .then(async () => { 
        console.log('Connected to MongoDB'); 
        await createCollectionIfNotExists(['clients', 'groupChats', 'messages']);
    })
    .catch((e: any) => {
        console.error('Error connecting to MongoDB:', e);
    });

const wss = new WebSocketServer({ port: 8080 });
const clients: Map<WServ, { clientId: mongoose.Types.ObjectId; sessionId: string }> = new Map();

wss.on('connection', async (ws: WServ) => {
    console.log('New client connected');

    const clientId = new mongoose.Types.ObjectId();
    const sessionId = uuidv4();
    clients.set(ws, { clientId, sessionId });
    
    ws.send(JSON.stringify({ type: 'sessionId', sessionId }));
    ws.send(JSON.stringify({ type: 'connection', message: 'Connection established' }));

    ws.on('message', async (message: string) => {
        let parsedMessage: MessagePayload;

        try {
            parsedMessage = JSON.parse(message);
        } catch (e) {
            console.log('Invalid message format');
            return;
        }

        const { type, content, chatName, audioData } = parsedMessage;
        const client = clients.get(ws);
        switch(type) {
            case 'chat-message':
                if(client?.clientId.toString() !== parsedMessage.clientId || client.sessionId !== parsedMessage.sessionId) {
                    ws.send(JSON.stringify({ type: 'status', status: 'error', content, chatName, clientId: parsedMessage.clientId }));
                } else if (content && chatName) {
                    try {
                        await handleChatMessage(content, chatName, clients, ws);
                        ws.send(JSON.stringify({ type: 'status', status: 'sent', content, chatName, clientId: parsedMessage.clientId }));
                    } catch (error) {
                        console.error('Error handling chat message:', error);
                        ws.send(JSON.stringify({ type: 'status', status: 'error', content, chatName, clientId: parsedMessage.clientId }));
                    }
                } else {
                    console.log('Chat message missing content or chatName');
                }
                break;
            case 'audio-message':
                if(client?.clientId.toString() !== parsedMessage.clientId || client.sessionId !== parsedMessage.sessionId) {
                    ws.send(JSON.stringify({ type: 'status', status: 'error', content, chatName, clientId: parsedMessage.clientId }));
                } else if (audioData && chatName) {
                    console.log('proc audio message');
                    try {
                        await handleAudioMessage(audioData, chatName, clients, ws);
                        ws.send(JSON.stringify({ type: 'status', status: 'sent', audioData, chatName, clientId: parsedMessage.clientId }));
                    } catch (error) {
                        console.error('Error handling audio message:', error);
                        ws.send(JSON.stringify({ type: 'status', status: 'error', audioData, chatName, clientId: parsedMessage.clientId }));
                    }
                } else {
                    console.log('Audio message missing data, chatName, or duration');
                }
                break;
            case 'disconnect':
                await handleDisconnect(ws);
                break;
            case 'register':
                await handleRegister(parsedMessage, ws);
                break;
            case 'login':
                await handleLogin(parsedMessage, ws);
                break;
            case 'history':
                const chatHistory = await getChatHistory(parsedMessage.chatName);
                ws.send(JSON.stringify({
                    type: 'history',
                    messages: chatHistory,
                }));
                break;
            default:
                console.log('Unknown type of message:', type);
                console.log('Full message:', parsedMessage);
                break;
        }
    });
    wss.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});



console.log('WS server running on port ws://localhost:8080');