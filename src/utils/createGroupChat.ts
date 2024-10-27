import mongoose from 'mongoose';
import GroupChats from '../models/groupChats.ts'; 

export const createGroupChat = async (chatName: string, creatorId: mongoose.Types.ObjectId) => {
    console.log('proc create===========');
    const groupChat = new GroupChats({
        name: chatName,
        clients: [creatorId],
        messages: []
    });

    try {
        const savedGroupChat = await groupChat.save();
        console.log('Group chat created successfully:', savedGroupChat);
        return savedGroupChat;
    } catch (error) {
        console.error('Error saving group chat:', error);
        throw error;
    }
};