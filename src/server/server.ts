import { WebSocketServer,type WebSocket as WServ } from 'ws';
import mongoose from 'mongoose';
import { 
    handleChatMessage,
    getChatHistory,
    handleDisconnect,
    handleLogin,
    handleRegister,
    createCollectionIfNotExists,  
} from '../utils/index.ts';
import dotenv from 'dotenv';
import Message from '../models/message.ts';

interface MessagePayload {
    content: string;
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

wss.on('connection', async (ws: WServ) => {
    console.log('New client connected');
    ws.send(JSON.stringify({ type: 'connection', message: 'Connection established' }));

    ws.on('message', async (message: string) => {
        console.log(`Received: ${message}`);
        
        let parsedMessage;

        try {
            parsedMessage = JSON.parse(message);
        } catch (e) {
            console.log('Invalid message format')
            return;
        }

        const { type, content, chatName} = parsedMessage;
        console.log('type of message', type);
        switch(type) {
            case 'chat-message':
                console.log('=============== new message', parsedMessage);
                await handleChatMessage(content, chatName, wss);
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
                const chatHistory = await getChatHistory(parsedMessage.chat);
                ws.send(JSON.stringify({
                    type: 'history',
                    messages: chatHistory,
                }));
                break;
            default:
                console.log('Unknown type of message', type);
                console.log('full message is', parsedMessage);
            break;
        }
    });
    
});

wss.on('close', () => {
    console.log('Client disconnected');
});

console.log('WS server running on port ws://localhost:8080');