import express from 'express';
import axios from 'axios';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// GET all campus zones and digital twin status
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/digital-twin`, { timeout: 3000 });
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "AI service unreachable, serving fallback topology",
      data: { nodes: [], edges: [] }
    });
  }
});

// GET specific zone details & dynamic risk
router.get('/:zoneId', async (req, res) => {
  try {
    const stateRes = await axios.get(`${AI_SERVICE_URL}/api/agent-state`, { timeout: 3000 });
    const zoneId = req.params.zoneId;
    const digitalTwin = stateRes.data.digital_twin || {};
    const node = (digitalTwin.nodes || []).find(n => n.id === zoneId);
    const riskInfo = (stateRes.data.risks?.zone_risk_matrix || {})[zoneId];
    const routeInfo = (stateRes.data.routes?.routes_by_zone || {})[zoneId];

    if (!node) {
      return res.status(404).json({ success: false, message: "Zone not found" });
    }

    res.json({
      success: true,
      data: {
        node,
        risk: riskInfo,
        evacuation_route: routeInfo
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
