import mongoose from "mongoose";
import GroupChats, { IGroupChats } from "../models/groupChats.ts";

export const addMemberToGroupChat = async (chatName: string, userId: mongoose.Types.ObjectId): Promise<IGroupChats | null> => {
    // Поиск группового чата по имени
    const groupChat = await GroupChats.findOne({ name: chatName });

    if (groupChat) {
        // Проверяем, есть ли пользователь уже в чате
        if (!groupChat.clients.some(client => client.equals(userId))) {
            // Добавляем пользователя в чат
            groupChat.clients.push(userId);
            await groupChat.save();
            return groupChat; // Возвращаем обновленный чат
        } else {
            console.log('User is already a member of the group chat.');
        }
    } else {
        console.log('Group chat not found.');
    }
    return null; // Если чат не найден или пользователь уже в чате
};