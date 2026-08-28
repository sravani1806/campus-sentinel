/**
 * Campus Sentinel - Real-Time Node.js Backend Server
 * Express REST APIs + Socket.io Real-Time Event Hub + MongoDB Persistent Store
 * Last updated: 2026-08-28T15:18:30Z
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import axios from 'axios';
import dotenv from 'dotenv';
import { store } from './store.js';
import { connectDB, getDbStatus } from './db/db.js';

import incidentRoutes from './routes/incidentRoutes.js';
import zoneRoutes from './routes/zoneRoutes.js';
import cameraRoutes from './routes/cameraRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import evacuationRoutes from './routes/evacuationRoutes.js';
import agentLogRoutes from './routes/agentLogRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

dotenv.config();

// Connect to MongoDB (with resilient in-memory fallback)
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

app.use(cors());
app.use(express.json());

// Inject Socket.io into request pipeline
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/evacuation', evacuationRoutes);
app.use('/api/agent-logs', agentLogRoutes);
app.use('/api/students', studentRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: "ONLINE",
    server: "Campus Sentinel Real-Time Node Gateway",
    uptime: process.uptime(),
    database: getDbStatus(),
    active_sockets: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// In-memory cache of latest agent telemetry
let cachedTelemetry = null;
let lastThreatLevel = "GREEN_NORMAL";

// Socket.io Real-Time Connection Handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Send cached telemetry immediately on connect
  if (cachedTelemetry) {
    socket.emit('telemetry_update', cachedTelemetry);
  }

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });

  socket.on('request_state_refresh', async () => {
    if (cachedTelemetry) {
      socket.emit('telemetry_update', cachedTelemetry);
    }
    try {
      const res = await axios.get(`${AI_SERVICE_URL}/api/agent-state`, { timeout: 3000 });
      cachedTelemetry = res.data;
      socket.emit('telemetry_update', cachedTelemetry);
    } catch (e) {
      console.log(`[Socket.io] State fetch error: ${e.message}`);
    }
  });

  socket.on('manual_alarm_trigger', (data) => {
    console.log(`[Socket.io] EMERGENCY ALARM TRIGGERED:`, data);
    io.emit('emergency_broadcast', {
      type: "MANUAL_ALARM_ACTIVATED",
      zone: data.zone_id || "ALL_CAMPUS",
      message: data.message || "EVACUATE IMMEDIATELY: Follow illuminated emergency green pathways.",
      timestamp: new Date().toISOString()
    });
  });
});

// Background Telemetry Poller: Pulls updates from Python AI service and pushes via Socket.io
setInterval(async () => {
  try {
    const res = await axios.get(`${AI_SERVICE_URL}/api/agent-state`, { timeout: 3000 });
    const telemetry = res.data;
    if (telemetry) {
      cachedTelemetry = telemetry;
      // Broadcast real-time agent telemetry
      io.emit('telemetry_update', telemetry);

      // Check if threat level changed or alert needs to be broadcast
      const currentThreat = telemetry.threat_level;
      if (currentThreat !== lastThreatLevel && currentThreat !== "GREEN_NORMAL") {
        io.emit('emergency_alert', {
          threat_level: currentThreat,
          max_risk: telemetry.max_risk_score,
          commander_directives: telemetry.commander?.directives || [],
          pa_announcement: telemetry.commander?.pa_announcement || "",
          priority_zones: telemetry.risks?.priority_evacuation_zones || [],
          timestamp: new Date().toISOString()
        });

        // Store log in store
        store.addAgentLog({
          type: "THREAT_STATE_CHANGE",
          threat_level: currentThreat,
          max_risk: telemetry.max_risk_score,
          commander_assessment: telemetry.commander?.assessment
        });
      }
      lastThreatLevel = currentThreat;
    }
  } catch (err) {
    // AI service might be restarting or running a long calculation
  }
}, 1000);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛡️  CAMPUS SENTINEL REAL-TIME NODE.JS SERVER`);
  console.log(`📡  Port: http://localhost:${PORT}`);
  console.log(`🤖  Connected AI Service: ${AI_SERVICE_URL}`);
  console.log(`🗄️  Database Layer: Active`);
  console.log(`====================================================`);
});
