import GroupChats from "../models/groupChats.ts";
import mongoose from "mongoose";
interface IGroupChat extends Document {
    name: string;
    members: mongoose.Types.ObjectId[];
    messages: IMessage[];
  }
  interface IMessage extends Document {
    content?: string;
    chat: string;
    audioData?: string; 
    duration?: number;
    createdAt: Date;
    clientId: mongoose.Types.ObjectId;
  }
export const getUserGroupChats = async (userId: mongoose.Types.ObjectId): Promise<IGroupChat[]> => {
    return await GroupChats.find({ members: userId });
};