import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import Message from "../models/message.ts";

interface MessagePayload {
    content: string;
}

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatDatabase';
mongoose.connect(mongoURI, {})
    .then(() => { 
        console.log('Connected to MongoDB'); 
    })
    .catch((e: any) => {
        console.error('Error connecting to MongoDB:', e);
    });

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message: string) => {  // Убедитесь, что тип message строковый
        console.log(`Received: ${message}`);

        const newMessage = new Message({ content: message });
        await newMessage.save();
        
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

wss.on('close', () => {
    console.log('Client disconnected');
});

console.log('WS server running on port ws://localhost:8080');