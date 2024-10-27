import mongoose from 'mongoose';
import Message from '../models/message.ts';
import GroupChats from '../models/groupChats.ts'; 
import { type WebSocket as WServ } from 'ws';

export const getGroupChatMessages = async (clientId: string) => {
    try {
        const groupChats = await GroupChats.find({ participants: clientId });

        const chatMessages = await Promise.all(
            groupChats.map(async (chat) => {
                const messages = await Message.find({ chat: chat.name })
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .exec();
                return {
                    chatName: chat.name,
                    messages: messages.reverse(), 
                };
            })
        );

        return chatMessages;
    } catch (error) {
        console.error('Error fetching group chat messages:', error);
        return [];
    }
};