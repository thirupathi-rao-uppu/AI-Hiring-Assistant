import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
    title: string;
    description: string;
    skills: string[];
    createdAt: Date;
}

const JobSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IJob>('Job', JobSchema);
