import mongoose, { Document, Schema } from "mongoose";

interface IClient extends Document {
    name: string;
    password: string;
    email: string;
    groupChats: mongoose.Types.ObjectId[];
}

const clientSchema = new Schema<IClient>({
    name: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    email: { type: String, required: true },
    groupChats: [{type: mongoose.Schema.Types.ObjectId, ref: 'GroupChat'} ]
},{timestamps: true});

const Client = mongoose.model<IClient>('Client', clientSchema);
export default Client;