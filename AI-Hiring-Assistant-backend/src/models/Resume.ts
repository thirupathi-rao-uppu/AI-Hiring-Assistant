import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
    jobId: mongoose.Types.ObjectId;
    candidateName: string;
    contentText: string;
    score: number;
    reasoning: string;
    interviewQuestions: string[];
    filePath: string;
    status: 'pending' | 'processed' | 'failed';
    createdAt: Date;
}

const ResumeSchema: Schema = new Schema({
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    candidateName: { type: String, required: true },
    contentText: { type: String },
    score: { type: Number, default: 0 },
    reasoning: { type: String },
    interviewQuestions: { type: [String], default: [] },
    filePath: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IResume>('Resume', ResumeSchema);
