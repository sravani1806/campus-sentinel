import express from 'express';
import { store } from '../store.js';

const router = express.Router();

// POST Student Login or Registration (One-time login)
router.post('/login', async (req, res) => {
  try {
    const { name, email, roll_no, department, phone, current_zone } = req.body;

    if (!name && !email && !roll_no) {
      return res.status(400).json({ success: false, message: 'Please provide at least a name, roll number, or email.' });
    }

    const student = await store.loginOrRegisterStudent({
      name: name || "Student",
      email: email || "",
      roll_no: roll_no || "",
      department: department || "Computer Science & Engineering",
      phone: phone || "",
      current_zone: current_zone || "BLOCK_B_L1"
    });

    if (req.io) {
      req.io.emit('student_status_updated', { student, timestamp: new Date().toISOString() });
    }

    res.status(200).json({
      success: true,
      message: 'Student logged in and registered to Sentinel MongoDB Database',
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all students from MongoDB
router.get('/', async (req, res) => {
  try {
    const { status, zone_id, search } = req.query;
    const list = await store.getStudents({ status, zone_id, search });
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET student by ID / Email / Roll
router.get('/:id', async (req, res) => {
  try {
    const student = await store.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Student Safety Check-in ("I Am Safe" or "I Am In Danger")
router.post('/check-in', async (req, res) => {
  try {
    const { student_id, user_name, name, roll_no, email, zone_id, zone_name, status, message, phone } = req.body;

    const checkinStatus = status === 'IN_DANGER' || status === 'SOS_NEED_HELP' ? 'IN_DANGER' : 'SAFE';

    const checkin = await store.recordSafetyCheckin({
      student_id: student_id || roll_no || email || `STU-${Date.now()}`,
      user_name: user_name || name || "Campus Resident",
      zone_id: zone_id || "BLOCK_B_L1",
      zone_name: zone_name || zone_id || "Campus Zone",
      status: checkinStatus,
      message: message || (checkinStatus === 'SAFE' ? 'Reported SAFE via Student PWA' : 'URGENT: Requires assistance!'),
      phone: phone || ''
    });

    const updatedStudent = await store.getStudentById(checkin.student_id);

    if (req.io) {
      req.io.emit('student_status_updated', {
        student: updatedStudent,
        checkin: checkin,
        timestamp: new Date().toISOString()
      });
      req.io.emit('safety_checkin_received', checkin);
    }

    res.status(201).json({
      success: true,
      message: `Safety status recorded as ${checkinStatus} in MongoDB`,
      data: {
        checkin,
        student: updatedStudent
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE clear all old test records from MongoDB
router.delete('/clear', async (req, res) => {
  try {
    const result = await store.clearAllStudents();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
