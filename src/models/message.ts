import mongoose, { Document, Schema } from 'mongoose';

interface IMessage extends Document {
    content: string;
    chat: string;
  }

  const messageSchema = new Schema<IMessage>(
    {
      content: { type: String, required: true },
      chat: { type: String, default: 'main' },
    },
    { timestamps: true }
  );

const Message = mongoose.model('Message', messageSchema);
export default Message;