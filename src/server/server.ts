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
    getUserGroupChats,
    addMemberToGroupChat,
    createGroupChat,
    getGroupChatMessages,  
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
    newMemberId?: mongoose.Types.ObjectId;
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
    const userGroupChats = await getUserGroupChats(clientId);
    ws.send(JSON.stringify({ type: 'user-group-chats', chats: userGroupChats }));
    
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
        let id;
        switch(type) {
            case 'create-group-chat':
                console.log('proc create chat');
                if(client){
                    await createGroupChat(parsedMessage.chatName, new mongoose.Types.ObjectId(parsedMessage.clientId));
                }
                break;
            case 'add-member-to-group':
                if(parsedMessage.newMemberId){
                    await addMemberToGroupChat(parsedMessage.chatName, parsedMessage.newMemberId);
                }
                break;
            case 'chat-message':
                //@ts-ignore
                if(client && client.sessionId.toString() !== parsedMessage.sessionId.toString()) {
                    console.log('proc failed');
                    ws.send(JSON.stringify({ type: 'status', status: 'error', content, chatName, clientId: parsedMessage.clientId }));
                } else if (content && chatName) {
                    try {
                        console.log('start saving message');
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
            case 'get-group-chat-messages':
                if(client){
                    const messages = await getGroupChatMessages(client.clientId.toString());
                    ws.send(JSON.stringify({
                    type: 'group-chat-messages',
                    chatName,
                    messages,
                }));
                 }
                break;
            case 'audio-message':
                console.log('proc voice');
                if(client && client.sessionId !== parsedMessage.sessionId) {
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
                id = await handleLogin(parsedMessage, ws);
                console.log('id is srver is', id);
                break;
            case 'history':
            if (client) {
                console.log('here', parsedMessage.clientId);
                console.log('and here', new mongoose.Types.ObjectId(parsedMessage.clientId));
                if (typeof parsedMessage.clientId === 'string' && mongoose.Types.ObjectId.isValid(parsedMessage.clientId)) {
                    const chatHistory = await getChatHistory(new mongoose.Types.ObjectId(parsedMessage.clientId));
                    ws.send(JSON.stringify({
                        type: 'history',
                        messages: chatHistory,
                    }));
                } else {
                    console.error('Invalid clientId:', parsedMessage.clientId);
                }
            }
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