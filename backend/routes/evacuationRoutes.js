import express from 'express';
import axios from 'axios';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// GET Dynamic evacuation route for a zone
router.get('/plan/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const response = await axios.get(`${AI_SERVICE_URL}/api/route/${zoneId}`, { timeout: 3000 });
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
