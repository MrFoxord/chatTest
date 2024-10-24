import mongoose, { Document, Schema } from 'mongoose';

interface IGroupChat extends Document {
  name: string;
  clients: mongoose.Types.ObjectId[];
}

const groupChatSchema = new Schema<IGroupChat>({
    name: { type: String, required: true },
    clients: [{ type: mongoose.Types.ObjectId, ref: 'Client' }],
  });

const GroupChat = mongoose.model<IGroupChat>('GroupChat', groupChatSchema);
export default GroupChat;