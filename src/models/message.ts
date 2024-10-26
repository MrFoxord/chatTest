import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    content?: string;
    chat: string;
    audioData?: string; 
    duration?: number;
    createdAt: Date;
    clientId: mongoose.Types.ObjectId;
}

const messageSchema = new Schema<IMessage>(
    {
        content: { type: String, required: false },
        chat: { type: String, required: true, default: 'main' },
        audioData: { type: String, required: false },
        duration: { type: Number, required: false },
        createdAt: { type: Date, required: false },
        clientId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Client' }
    },
    { timestamps: true }
);

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;