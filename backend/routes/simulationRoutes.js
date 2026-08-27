import express from 'express';
import axios from 'axios';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// POST Trigger a what-if disaster simulation scenario
router.post('/scenario', async (req, res) => {
  const { scenario_id } = req.body;
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/simulation/scenario`, { scenario_id }, { timeout: 5000 });
    
    // Broadcast scenario activation over Socket.io
    if (req.io) {
      req.io.emit('telemetry_update', response.data.state);
      req.io.emit('scenario_triggered', {
        scenario_id,
        state: response.data.state,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Inject custom hazard
router.post('/hazard', async (req, res) => {
  const { zone_id, fire, smoke, blocked } = req.body;
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/set-hazard`, {
      zone_id,
      fire: Number(fire || 0),
      smoke: Number(smoke || 0),
      blocked: Boolean(blocked)
    }, { timeout: 5000 });

    if (req.io && response.data?.new_state) {
      req.io.emit('telemetry_update', response.data.new_state);
      req.io.emit('hazard_updated', response.data);
    }

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Clear all hazards
router.post('/reset', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/clear-hazards`, {}, { timeout: 5000 });

    if (req.io && response.data?.new_state) {
      req.io.emit('telemetry_update', response.data.new_state);
      req.io.emit('hazards_cleared', response.data);
    }

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
