import mongoose from 'mongoose';
import Message from '../models/message.ts';
import GroupChats from '../models/groupChats.ts'; 

export const getChatHistory = async (clientId: mongoose.Types.ObjectId) => {
    try {
        const chatHistories = [];

        // Шаг 1: Найти все групповые чаты, в которых есть данный клиент
        const groupChats = await GroupChats.find({ clients: clientId }).exec();
        console.log('Group chats are:', groupChats);

        // Шаг 2: Для каждого группового чата получить последние 20 сообщений
        for (const chat of groupChats) {
            const lastMessages = await Message.find({ chat: chat.name }) // Предполагаем, что в сообщениях есть поле chat
                .sort({ createdAt: -1 })
                .limit(20)
                .exec();

            lastMessages.reverse(); // Чтобы вернуть их в порядке от старого к новому

            // Шаг 3: Форматирование результата
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

        // Шаг 4: Получить последние 20 сообщений для чата с именем 'main'
        
        
            const mainChatMessages = await Message.find() // Предполагаем, что в сообщениях есть поле chat
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

        return chatHistories; // Вернуть все истории чатов с их сообщениями
    } catch (error) {
        console.error('Error fetching chat histories:', error);
        return []; 
    }
};