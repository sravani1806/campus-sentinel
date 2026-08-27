import express from 'express';
import { store } from '../store.js';

const router = express.Router();

// GET all incidents
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: store.getIncidents()
  });
});

// POST new incident
router.post('/', (req, res) => {
  const { title, zone_id, zone_name, hazard_type, severity, description, reported_by } = req.body;
  if (!title || !zone_id) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const incident = store.addIncident({
    title,
    zone_id,
    zone_name: zone_name || zone_id,
    hazard_type: hazard_type || "UNKNOWN",
    severity: severity || "HIGH",
    description: description || "Manually reported crisis incident",
    reported_by: reported_by || "Campus Safety Dispatch",
    actions_taken: ["Incident logged in Sentinel Command Bus"]
  });

  // Broadcast event
  if (req.io) {
    req.io.emit('incident_created', incident);
  }

  res.status(201).json({
    success: true,
    data: incident
  });
});

// PATCH update incident status
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const updated = store.updateIncidentStatus(id, status, notes);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Incident not found" });
  }

  if (req.io) {
    req.io.emit('incident_updated', updated);
  }

  res.json({
    success: true,
    data: updated
  });
});

// POST user safety check-in ("I Am Safe" or "Need SOS")
router.post('/check-in', (req, res) => {
  const { user_name, user_id, zone_id, status, message } = req.body;
  const checkin = store.recordSafetyCheckin({
    user_name: user_name || "Campus Resident",
    user_id: user_id || `USR-${Math.floor(Math.random() * 9000 + 1000)}`,
    zone_id: zone_id || "UNKNOWN",
    status: status || "SAFE", // "SAFE" or "SOS_NEED_HELP"
    message: message || ""
  });

  if (req.io) {
    req.io.emit('safety_checkin_received', checkin);
  }

  res.status(201).json({
    success: true,
    data: checkin
  });
});

// GET all safety check-ins
router.get('/check-ins', (req, res) => {
  res.json({
    success: true,
    data: store.getSafetyCheckins()
  });
});

export default router;
