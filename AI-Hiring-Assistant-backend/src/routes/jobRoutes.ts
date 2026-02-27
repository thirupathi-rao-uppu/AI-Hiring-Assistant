import { Router } from 'express';
import axios from 'axios';

const router = Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.post('/extract-skills', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Job description text is required' });
        }

        const response = await axios.post(`${AI_SERVICE_URL}/extract-skills`, { text });
        res.json(response.data);
    } catch (error) {
        console.error('Error extracting skills:', error);
        res.status(500).json({ message: 'Error communicating with AI service' });
    }
});

export default router;
