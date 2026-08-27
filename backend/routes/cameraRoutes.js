import express from 'express';
import axios from 'axios';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// GET all cameras with detections
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/cameras`, { timeout: 3000 });
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET camera snapshot JPEG stream
router.get('/:camId/snapshot', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/camera-frame/${req.params.camId}`, {
      responseType: 'arraybuffer',
      timeout: 3000
    });
    res.set('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Unable to render frame snapshot");
  }
});

export default router;
