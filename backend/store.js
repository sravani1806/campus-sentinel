/**
 * Campus Sentinel Backend - Resilient Data Store & Database Adapter
 * Provides seamless in-memory & persistent storage with full MongoDB support.
 */

import { StudentModel } from './models/Student.js';
import { SafetyCheckinModel } from './models/SafetyCheckin.js';
import { getDbStatus } from './db/db.js';

class SentinelDataStore {
  constructor() {
    this.incidents = [
      {
        id: "INC-2026-001",
        title: "Thermal Anomaly & Smoke Drift",
        zone_id: "BLOCK_B_L1",
        zone_name: "U Block",
        hazard_type: "FIRE_SMOKE",
        severity: "HIGH",
        status: "INVESTIGATING",
        timestamp: new Date().toISOString(),
        reported_by: "Sentinel YOLOv11 Vision Agent",
        description: "Elevated temperature and dense particulate plume identified near Chemistry Lab 3.",
        assigned_units: ["Fire Engine Alpha", "Security QRF"],
        actions_taken: ["Automated alarm broadcast", "Zone A* egress replanned to Main Gate"]
      },
      {
        id: "INC-2026-002",
        title: "Corridor Chokepoint & High Density Surge",
        zone_id: "CORRIDOR_NORTH",
        zone_name: "North Skyway / Promenade",
        hazard_type: "CROWD_SURGE",
        severity: "MEDIUM",
        status: "MONITORING",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        reported_by: "Crowd Intelligence Agent",
        description: "Student throughput exceeding 85% capacity between Library and Academic Block.",
        assigned_units: ["Campus Safety Marshall 2"],
        actions_taken: ["Digital wayfinding signs switched to divert pedestrian flow"]
      }
    ];

    this.agentLogs = [];
    this.userSafetyCheckins = [];
    this.students = []; // Starts clean - populated when students log in
  }

  // --- Incidents ---
  getIncidents() {
    return this.incidents;
  }

  addIncident(incident) {
    const newInc = {
      id: `INC-2026-${String(this.incidents.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      status: "ACTIVE",
      ...incident
    };
    this.incidents.unshift(newInc);
    return newInc;
  }

  updateIncidentStatus(id, status, notes) {
    const inc = this.incidents.find(i => i.id === id);
    if (inc) {
      inc.status = status;
      if (notes) {
        inc.actions_taken = inc.actions_taken || [];
        inc.actions_taken.push(notes);
      }
      return inc;
    }
    return null;
  }

  // --- Agent Logs ---
  addAgentLog(log) {
    this.agentLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...log
    });
    if (this.agentLogs.length > 100) this.agentLogs.pop();
  }

  getAgentLogs() {
    return this.agentLogs;
  }

  // --- Student Auth & MongoDB Roster ---
  async loginOrRegisterStudent({ name, email, roll_no, department, phone, current_zone }) {
    const identifier = (email || roll_no || name || '').trim().toLowerCase();
    const studentId = roll_no ? `STU-${roll_no.toUpperCase()}` : (email ? `STU-${email.split('@')[0].toUpperCase()}` : `STU-${Date.now()}`);

    const dbStatus = getDbStatus();

    // Check MongoDB if connected
    if (dbStatus.isConnected) {
      try {
        let existing = await StudentModel.findOne({
          $or: [
            { email: { $regex: `^${email}$`, $options: 'i' } },
            { roll_no: { $regex: `^${roll_no}$`, $options: 'i' } },
            { student_id: studentId }
          ]
        });

        if (existing) {
          if (name) existing.name = name;
          if (department) existing.department = department;
          if (phone) existing.phone = phone;
          if (current_zone) existing.current_zone = current_zone;
          await existing.save();
          return existing.toObject();
        }

        // Create new student in MongoDB
        const newStudentDoc = await StudentModel.create({
          student_id: studentId,
          name: name || "Campus Student",
          email: email || "",
          roll_no: roll_no || studentId,
          department: department || "Computer Science & Engineering",
          current_zone: current_zone || "BLOCK_B_L1",
          zone_name: current_zone || "U Block",
          status: "UNACCOUNTED",
          phone: phone || "+91 98765 43210",
          emergency_message: "Logged in via Student PWA",
          last_checkin_time: new Date()
        });

        return newStudentDoc.toObject();
      } catch (err) {
        console.error('[Store] MongoDB student login/register error:', err.message);
      }
    }

    // In-memory fallback
    let existingMem = this.students.find(s => 
      (s.email && s.email.toLowerCase() === identifier) ||
      (s.roll_no && s.roll_no.toLowerCase() === identifier) ||
      (s.student_id === studentId)
    );

    if (existingMem) {
      if (name) existingMem.name = name;
      if (department) existingMem.department = department;
      if (phone) existingMem.phone = phone;
      if (current_zone) existingMem.current_zone = current_zone;
      return existingMem;
    }

    const newMemStudent = {
      student_id: studentId,
      name: name || "Campus Student",
      email: email || "",
      roll_no: roll_no || studentId,
      department: department || "Computer Science & Engineering",
      current_zone: current_zone || "BLOCK_B_L1",
      zone_name: current_zone || "U Block",
      status: "UNACCOUNTED",
      phone: phone || "+91 98765 43210",
      emergency_message: "Logged in via Student PWA",
      last_checkin_time: new Date().toISOString()
    };
    this.students.unshift(newMemStudent);
    return newMemStudent;
  }

  async getStudents(filters = {}) {
    const { status, zone_id, search } = filters;
    const dbStatus = getDbStatus();

    if (dbStatus.isConnected) {
      try {
        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (zone_id && zone_id !== 'ALL') query.current_zone = zone_id;
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { roll_no: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } }
          ];
        }
        return await StudentModel.find(query).sort({ updatedAt: -1 }).lean();
      } catch (err) {
        console.error('[Store] MongoDB getStudents error:', err.message);
      }
    }

    let list = [...this.students];
    if (status && status !== 'ALL') list = list.filter(s => s.status === status);
    if (zone_id && zone_id !== 'ALL') list = list.filter(s => s.current_zone === zone_id);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) ||
        (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getStudentById(studentId) {
    const dbStatus = getDbStatus();
    if (dbStatus.isConnected) {
      try {
        const doc = await StudentModel.findOne({ 
          $or: [{ student_id: studentId }, { roll_no: studentId }, { email: studentId }, { name: studentId }] 
        }).lean();
        if (doc) return doc;
      } catch (e) {}
    }
    return this.students.find(s => 
      s.student_id === studentId || s.roll_no === studentId || s.email === studentId || s.name.toLowerCase() === studentId.toLowerCase()
    ) || null;
  }

  async updateStudentStatus(studentId, updateData) {
    const now = new Date();
    const dbStatus = getDbStatus();

    if (dbStatus.isConnected) {
      try {
        const doc = await StudentModel.findOneAndUpdate(
          { $or: [{ student_id: studentId }, { roll_no: studentId }, { email: studentId }, { name: studentId }] },
          {
            $set: {
              ...updateData,
              last_checkin_time: now
            }
          },
          { new: true, upsert: true }
        ).lean();
        return doc;
      } catch (err) {
        console.error('[Store] MongoDB updateStudentStatus error:', err.message);
      }
    }

    let record = this.students.find(s => s.student_id === studentId || s.roll_no === studentId);
    if (record) {
      Object.assign(record, updateData, { last_checkin_time: now.toISOString() });
      return record;
    }

    record = {
      student_id: studentId,
      name: updateData.name || "Campus Student",
      roll_no: updateData.roll_no || studentId,
      status: updateData.status || "SAFE",
      current_zone: updateData.current_zone || "BLOCK_B_L1",
      emergency_message: updateData.emergency_message || updateData.message || "",
      last_checkin_time: now.toISOString()
    };
    this.students.unshift(record);
    return record;
  }

  async recordSafetyCheckin(data) {
    const record = {
      id: `CHK-${Date.now()}`,
      student_id: data.student_id || `STU-${Date.now()}`,
      user_name: data.user_name || data.name || "Campus Resident",
      zone_id: data.zone_id || "BLOCK_B_L1",
      zone_name: data.zone_name || data.zone_id || "Campus",
      status: data.status || "SAFE",
      message: data.message || "",
      phone: data.phone || "",
      timestamp: new Date().toISOString()
    };

    this.userSafetyCheckins.unshift(record);
    if (this.userSafetyCheckins.length > 200) this.userSafetyCheckins.pop();

    // Update the student document in MongoDB!
    await this.updateStudentStatus(record.student_id, {
      name: record.user_name,
      current_zone: record.zone_id,
      zone_name: record.zone_name,
      status: record.status,
      emergency_message: record.message,
      phone: record.phone
    });

    const dbStatus = getDbStatus();
    if (dbStatus.isConnected) {
      try {
        await SafetyCheckinModel.create(record);
      } catch (e) {
        console.error('[Store] MongoDB SafetyCheckin creation error:', e.message);
      }
    }

    return record;
  }

  getSafetyCheckins() {
    return this.userSafetyCheckins;
  }

  async clearAllStudents() {
    this.students = [];
    this.userSafetyCheckins = [];
    const dbStatus = getDbStatus();
    if (dbStatus.isConnected) {
      try {
        await StudentModel.deleteMany({});
        await SafetyCheckinModel.deleteMany({});
      } catch (e) {
        console.error('[Store] MongoDB clear error:', e.message);
      }
    }
    return { success: true, message: "All student records cleared from MongoDB" };
  }
}

export const store = new SentinelDataStore();
