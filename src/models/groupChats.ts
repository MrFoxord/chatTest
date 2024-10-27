import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupChats extends Document {
  name: string;
  clients: mongoose.Types.ObjectId[];
}

const groupChatSchema = new Schema<IGroupChats>({
  name: { type: String, required: true },
  clients: [{ type: mongoose.Types.ObjectId, ref: 'clients' }], // Поменяйте на members, если хотите использовать это имя
});

const GroupChats = mongoose.model<IGroupChats>('groupChats', groupChatSchema);
export default GroupChats;