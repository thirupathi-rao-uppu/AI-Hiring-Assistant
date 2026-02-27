import { Router } from 'express';
import { upload } from '../config/multer';
import Resume from '../models/Resume';
import axios from 'axios';
import fs from 'fs';

const router = Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

import FormData from 'form-data';

router.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { jobId, jobDescription } = req.body;
        if (!jobId) {
            return res.status(400).json({ message: 'jobId is required' });
        }

        // 1. Send file to Python AI Service for parsing
        const fileForm = new FormData();
        fileForm.append('file', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const parseResponse = await axios.post(`${AI_SERVICE_URL}/parse-resume`, fileForm, {
            headers: { ...fileForm.getHeaders() }
        });

        const resumeText = parseResponse.data.text;

        // 2. Send parsed text to AI Service for analysis/ranking
        const analysisResponse = await axios.post(`${AI_SERVICE_URL}/analyze-resume`, {
            job_description: jobDescription || "Standard requirements for the role.",
            resume_text: resumeText
        });

        const analysis = analysisResponse.data;

        // 3. Save to MongoDB
        const newResume = new Resume({
            jobId,
            candidateName: req.file.originalname,
            filePath: req.file.path,
            status: 'processed',
            score: analysis.score,
            reasoning: analysis.reasoning,
            interviewQuestions: analysis.interview_questions
        });

        await newResume.save();

        res.status(201).json({
            message: 'Resume analyzed successfully.',
            resume: newResume
        });

    } catch (error: any) {
        console.error('Upload & Analysis Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'AI Analysis failed',
            error: error.response?.data || error.message
        });
    }
});

// Get Resumes for a job
router.get('/job/:jobId', async (req, res) => {
    try {
        const resumes = await Resume.find({ jobId: req.params.jobId }).sort({ score: -1 });
        res.json(resumes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching resumes' });
    }
});

export default router;
