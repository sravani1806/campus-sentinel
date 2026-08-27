import express from 'express';
import axios from 'axios';
import { store } from '../store.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// GET Live Agentic AI State & LangGraph Loop Output
router.get('/state', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/agent-state`, { timeout: 3000 });
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "AI service starting or unreachable",
      data: null
    });
  }
});

// GET Recorded Agent Decision History
router.get('/history', (req, res) => {
  res.json({
    success: true,
    data: store.getAgentLogs()
  });
});

export default router;
