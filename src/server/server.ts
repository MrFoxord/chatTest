import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import Message from '../models/message.ts'; // Импортируйте модели
import Client from '../models/clients';
import GroupChat from '../models/groupChats.ts';
import dotenv from 'dotenv';

interface MessagePayload {
    content: string;
}
// utils
const createCollectionIfNotExists = async(collectionNames: string[]) =>{
    const db = mongoose.connection.db;
    if(db){
        const collections = await db.listCollections().toArray();
        const existingCollections = collections.map((col) => col.name);
    
        for (const collectionName of collectionNames) {
            if(!existingCollections.includes(collectionName)) {
                console.log(`Creating collection ${collectionName}`);
                await mongoose.connection.db?.createCollection(collectionName);
            } else {
                console.log(`Collection ${collectionName} already exists`);
            }
        }
    } else {
        console.error('MongoDB connection is not established or db is undefined.');
    }
    
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

wss.on('connection', async (ws) => {
    console.log('New client connected');
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

        switch(type) {
            case 'chat-message':
                const newMessage = new Message({
                    content,
                    chat: chatName,
                });

                try {
                    await newMessage.save();
                    wss.clients.forEach(client=>{
                        if(client.readyState === 1) {
                            client.send(JSON.stringify({ type: 'chat-message', content, chatName}));
                        }
                    })
                } catch(e) {
                    console.log('Error saving message', e);
                }
                break;

            case 'disconnect':
                console.log('Client disconnected');
                break;

            default:
                console.log('Unknown type of message', type);
                console.log('full message is', parsedMessage);
        }
    });
    
    try {
        const lastMessages = await Message.find().sort({ createdAt: -1 }).limit(20).exec();
        lastMessages.reverse(); 
        ws.send(JSON.stringify({ type: 'history', messages: lastMessages.map(msg => ({ content: msg.content, chatName: msg.chat })) }));
    } catch (error) {
        console.error('Error fetching messages:', error);
    }

    
});

wss.on('close', () => {
    console.log('Client disconnected');
});

console.log('WS server running on port ws://localhost:8080');