/**
 * Campus Sentinel Backend - Resilient Data Store
 * Provides seamless in-memory & persistent storage with optional MongoDB hook.
 */

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
  }

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

  recordSafetyCheckin(data) {
    const record = {
      id: `SOS-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...data
    };
    this.userSafetyCheckins.unshift(record);
    return record;
  }

  getSafetyCheckins() {
    return this.userSafetyCheckins;
  }
}

export const store = new SentinelDataStore();
