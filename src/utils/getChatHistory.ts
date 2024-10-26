import Message from '../models/message.ts';

export const getChatHistory = async (chatName: string) => {
    try {
        const lastMessages = await Message.find({ chat: chatName })
            .sort({ createdAt: -1 })
            .limit(20)
            .exec();

        lastMessages.reverse();

        return lastMessages.map(msg => ({
            content: msg.content,
            chatName: msg.chat,
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return []; 
    }
};