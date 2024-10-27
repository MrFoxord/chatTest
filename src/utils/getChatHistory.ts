import mongoose from 'mongoose';
import Message from '../models/message.ts';
import GroupChats from '../models/groupChats.ts'; 

export const getChatHistory = async (clientId: mongoose.Types.ObjectId) => {
    try {
        const chatHistories = [];

        const groupChats = await GroupChats.find({ clients: clientId }).exec();
        console.log('Group chats are:', groupChats);

        for (const chat of groupChats) {
            const lastMessages = await Message.find({ chat: chat.name }) 
                .sort({ createdAt: -1 })
                .limit(20)
                .exec();

            lastMessages.reverse();

            const formattedMessages = lastMessages.map(msg => ({
                content: msg.content,
                audioData: msg.audioData,
                createdAt: msg.createdAt,
                clientId: msg.clientId,
            }));

            chatHistories.push({
                chatName: chat.name,
                messages: formattedMessages,
            });
        }

        
        
            const mainChatMessages = await Message.find() 
                .sort({ createdAt: -1 })
                .limit(20)
                .exec();

            const formattedMainChatMessages = mainChatMessages.reverse().map(msg => ({
                content: msg.content,
                audioData: msg.audioData,
                createdAt: msg.createdAt,
                clientId: msg.clientId,
            }));

            chatHistories.push({
                chatName: 'main',
                messages: formattedMainChatMessages,
            });
        console.log('histories', chatHistories);
        return chatHistories;
    } catch (error) {
        console.error('Error fetching chat histories:', error);
        return []; 
    }
};