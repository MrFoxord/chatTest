import mongoose from "mongoose";
import GroupChats, { IGroupChats } from "../models/groupChats.ts";
import Clients from "../models/clients.ts"; // Импортируем модель пользователей

export const addMemberToGroupChat = async (chatName: string, username: string): Promise<IGroupChats | null> => {
    const groupChat = await GroupChats.findOne({ name: chatName });

    if (groupChat) {
        const user = await Clients.findOne({ name: username }); 

        if (user) {
            const userId = user._id;

            if (!groupChat.clients.some(client => client.toString() === userId.toString())) {
                // @ts-ignore
                groupChat.clients.push(new mongoose.Types.ObjectId(userId));
                await groupChat.save();
                return groupChat; 
            } else {
                console.log('User is already a member of the group chat.');
            }
        } else {
            console.log('User not found.');
        }
    } else {
        console.log('Group chat not found.');
    }
    return null;
};