# Campus Sentinel 🛡️

### **An Agentic AI–Powered Smart Campus Emergency Early-Warning & Autonomous Evacuation System**

> **Tagline**: Combining Computer Vision, LangGraph Multi-Agent Orchestration, Ollama Local LLM Reasoning, Dynamic Graph A* Pathfinding, and Real-Time WebSocket Communication to Detect Emergencies, Predict Evacuation Risks, and Autonomously Generate and Replann Safe Evacuation Strategies.

---

## 🌟 Executive Summary & Innovation

Traditional campus evacuation plans are static, printed on plastic boards, and assume every hallway and fire exit is clear during a disaster. When a fire breaks out, smoke fills stairwells, or crowd stampedes surge at a bottleneck, static exit signs lead people into dangerous traps.

**Campus Sentinel** solves this problem with a continuous **Agentic AI Closed-Loop**:

$$\text{SEE} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{PREDICT} \longrightarrow \text{SIMULATE} \longrightarrow \text{REPLAN} \longrightarrow \text{ACT}$$

1. **SEE**: Campus CCTV feeds stream continuously through YOLOv11 and ByteTrack to detect people, crowd surges, fire flares, and smoke plumes.
2. **UNDERSTAND**: The Crowd Intelligence & Hazard Agents evaluate spatial dispersion, corridor impassability, and velocity vectors.
3. **PREDICT**: The Risk Assessment Agent calculates a dynamic 0–100 risk score for every building and corridor on campus.
4. **SIMULATE**: The Simulation Agent uses queue dynamics to project future bottleneck chokepoints and clearance curves at $T+1\text{m}$, $T+3\text{m}$, and $T+5\text{m}$.
5. **REPLAN**: NetworkX and the dynamic A* Pathfinding engine recalculate safe exit paths, rerouting occupants away from compromised corridors.
6. **ACT**: The Commander Agent and Ollama Local LLM layer formulate natural-language tactical orders, synthesize automated Public Address (PA) broadcast announcements, and push real-time alerts to the Student Evacuation PWA.

---

## 🏗️ System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │             CAMPUS CCTV CAMERAS              │
                               │   (Quadrangle, Library, N Block, MHP, etc.)  │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           SEE: VISION AGENT (YOLOv11)        │
                               │   • Person Detection   • Fire / Smoke Plumes │
                               │   • ByteTrack ID Multi-Object Tracking       │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │    UNDERSTAND: CROWD & HAZARD AGENTS         │
                               │   • Crowd Velocity     • Impassability Flags │
                               │   • Density Ratios     • Obstacle Detection  │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │         PREDICT: RISK ASSESSMENT AGENT       │
                               │   • Multi-Factor Dynamic Zone Scoring (0-100)│
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │         SIMULATE: SIMULATION AGENT           │
                               │   • Queue Dynamics & Chokepoint Forecasts    │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │       REPLAN: ROUTE & RESOURCE AGENTS        │
                               │   • NetworkX Dynamic A* Pathfinding          │
                               │   • Ambulance / First Responder Corridors    │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │         ACT: COMMANDER & OLLAMA LLM          │
                               │   • Local LLM Tactical Directives            │
                               │   • Voice Synthesized PA Broadcast           │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                 ┌────────────────────┴────────────────────┐
                                 ▼                                         ▼
                 ┌───────────────────────────────┐         ┌───────────────────────────────┐
                 │  REAL-TIME NODE.JS + SOCKET.IO│         │  OFFLINE STUDENT EVACUATION   │
                 │      EMERGENCY GATEWAY        │         │        MOBILE PWA CLIENT      │
                 └───────────────┬───────────────┘         └───────────────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │    TACTICAL COMMAND CENTER    │
                 │  • 2.5D Digital Twin Canvas   │
                 │  • Multi-Camera AI Grid       │
                 │  • What-If Scenario Sandbox   │
                 └───────────────────────────────┘
```

---

## 🤖 The 8 Specialized AI Agents

| Agent Name | Engine & Technology | Responsibility |
| :--- | :--- | :--- |
| **1. Vision Agent** | YOLOv11 + OpenCV + ByteTrack | Ingests multi-camera CCTV video feeds, detects humans, bounding boxes, smoke plumes, fire flares, and flags blocked corridor doorways. |
| **2. Crowd Intelligence Agent** | ByteTrack Flow Vectors | Measures crowd density ($pers/m^2$), movement velocity vectors, stampede risk indicators, and detects exit door bottlenecks. |
| **3. Hazard Agent** | Spatial Geometry & Propagation | Tracks structural impassability, fire/smoke spread to adjacent corridors, and isolates compromised campus nodes. |
| **4. Risk Assessment Agent** | Composite Multi-Factor Scoring | Computes dynamic risk scores (0–100) per zone integrating direct hazard intensity, hazard proximity, crowd density, and trapped exit factors. |
| **5. Simulation Agent** | Predictive Queue Dynamics | Forecasts crowd evacuation progression and bottleneck chokepoints at $T+1\text{m}$, $T+3\text{m}$, and $T+5\text{m}$. |
| **6. Route Planning Agent** | NetworkX + Dynamic A* | Dynamically weights topological graph edges based on risk, width, and congestion; computes the safest shortest paths to open exit gates. |
| **7. Resource Agent** | Priority Corridor Router | Allocates and clears protected transit lanes for fire engines and ambulances from the Ambulance Bay to the incident zone. |
| **8. Commander Agent** | LangGraph + Ollama Local LLM | Synthesizes all agent intelligence, queries local Ollama models (e.g., Llama 3) for strategic decision reasoning, generates PA broadcast scripts, and logs tactical orders. |

---

## 💻 Technology Stack

### **Frontend**
* **React 18 & Vite**: Lightning-fast, modular dashboard & PWA build.
* **Tailwind CSS v4**: Mission-control dark tactical theme with custom glowing HUD glassmorphism.
* **Framer Motion**: Smooth UI state animations, laser path transitions, and radar sweeps.
* **Recharts**: Real-time risk distribution, queue dynamics, and exit gate balance charts.
* **Lucide React**: Modern iconography for tactical sensors, cameras, and emergency assets.
* **Service Workers & PWA Manifest**: Offline-capable mobile client with zero-connectivity emergency cache.

### **Backend**
* **Node.js & Express.js**: High-throughput REST API gateway.
* **Socket.io**: Bi-directional real-time event streaming between AI service, dashboard, and mobile devices.
* **Resilient Data Store**: In-memory and persistent JSON/MongoDB storage for emergency incident records and safety check-ins.

### **AI & Computer Vision Microservice**
* **Python 3.14 & FastAPI**: High-performance asynchronous microservice.
* **NetworkX**: Full campus topological graph modeling and dynamic edge-cost weighting.
* **OpenCV**: CCTV video frame synthesis, YOLO bounding box rendering, and thermal/scanline camera simulation.
* **Ollama Integration**: Local LLM reasoning layer with deterministic tactical reasoning fallback when offline.
* **LangGraph Architecture**: Cyclical multi-agent state graph coordinating SEE $\rightarrow$ ACT loops every 1.5 seconds.

---

## 🚀 Quickstart Guide

### **Prerequisites**
* [Node.js](https://nodejs.org/) (v18 or newer)
* [Python](https://www.python.org/) (v3.10 to v3.14)

---

### **Option 1: One-Click Launch (Windows)**

Simply double-click:
```bat
start-all.bat
```
*(Or run `.\start-all.ps1` in PowerShell)*

All 3 services will launch in dedicated terminal windows!

---

### **Option 2: Manual Step-by-Step Launch**

#### **1. Start the Python AI Microservice (Port 8000)**
```powershell
cd ai-service
.\venv\Scripts\activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*API Documentation & Swagger Docs available at: `http://localhost:8000/docs`*

#### **2. Start the Real-Time Node.js Backend (Port 5000)**
```powershell
cd backend
npm install
npm run dev
```

#### **3. Start the React Frontend & PWA (Port 5173)**
```powershell
cd frontend
npm install
npm run dev
```
*Open your browser at: `http://localhost:5173`*

---

## 🕹️ Interactive Features & Navigation

### **1. Command Center (`/`)**
* **2.5D Digital Twin Canvas**: Interactive SVG map showing all campus buildings, floor elevations, active fire/smoke overlays, dynamic laser A* paths, ambulance lanes, and occupancy bubbles. Click on any building to view instant telemetry and evacuation recommendations.
* **CCTV AI Surveillance Matrix**: 6 live video feeds rendered with YOLOv11 bounding boxes, ByteTrack tracking IDs, and thermal/night-vision mode toggle.
* **LangGraph Multi-Agent Terminal**: Live state-machine step progression and Ollama LLM Commander situational debriefs with a one-click **"Broadcast PA Voice Announcement"** button using the Web Speech API.

### **2. What-If Scenario Sandbox (`/simulation`)**
* Launch instant disaster scenarios:
  * *Chemical Fire in U Block*
  * *Auditorium Crowd Surge & Fire*
  * *Library Smoke Plume*
  * *North Highway Gate Blockage*
  * *Multi-Point Campus Crisis*
* **Custom Hazard Injector**: Pick any zone, adjust fire intensity (0–100%) and smoke density (0–100%), toggle corridor impassability, and watch the A* pathfinder replan paths across the entire campus in under 1.5 seconds!

### **3. Student Evacuation Mobile PWA (`/pwa`)**
* Mobile-optimized crisis companion.
* Zone selector ("Where are you?").
* Dynamic A* compass pointing to the safest unblocked exit gate with step-by-step waypoint instructions.
* One-tap **"I AM SAFE"** check-in button (logged into the Command Center incident registry).
* **"SOS DISTRESS BEACON"** button emitting an emergency audible siren and sending SOS alert coordinates.
* Offline-cached campus emergency hotlines and survival protocols.

### **4. Analytics & Incident Management (`/analytics` & `/incidents`)**
* Recharts dynamic risk matrices, evacuation clearance curves, and gate load balancing distributions.
* Full incident command log with status updates (`INVESTIGATING` $\rightarrow$ `RESOLVED`) and real-time student safety pings.

---

## 📡 API Reference Overview

### **AI & Routing Microservice (`http://127.0.0.1:8000`)**
* `GET /api/agent-state` — Returns full LangGraph unified telemetry.
* `POST /api/set-hazard` — Injects fire/smoke/blocked state into a zone.
* `POST /api/clear-hazards` — Clears all active hazards.
* `GET /api/route/{zone_id}` — Computes optimal A* route for a zone.
* `GET /api/digital-twin` — Returns graph topology, coordinates, and edge weights.
* `GET /api/cameras` — Returns camera detections and bounding boxes.
* `GET /api/camera-frame/{cam_id}` — Renders live OpenCV CCTV JPEG frame.
* `POST /api/simulation/scenario` — Triggers pre-configured What-If emergency scenario.

### **Real-Time Backend Gateway (`http://127.0.0.1:5000`)**
* `GET /api/incidents` — Retrieves all logged incidents.
* `POST /api/incidents` — Dispatches a new emergency incident.
* `PATCH /api/incidents/:id` — Updates incident containment status.
* `POST /api/incidents/check-in` — Submits student mobile safety check-in.
* `GET /api/incidents/check-ins` — Retrieves all safety check-ins.
* `WebSocket /socket.io` — Real-time telemetry, emergency alerts, and alarm broadcasts.

---

## 🏆 Hackathon Delivery Checklist

- [x] **Agentic AI Architecture**: 8 specialized agents coordinated with LangGraph state machine.
- [x] **Local LLM Reasoning**: Ollama LLM integration with intelligent local heuristic reasoning fallback.
- [x] **Dynamic Routing Engine**: NetworkX + A* algorithm with dynamic hazard weights and multi-exit load balancing.
- [x] **Computer Vision Pipeline**: YOLOv11 person/fire/smoke detection and ByteTrack tracking simulation.
- [x] **Interactive 2.5D Digital Twin**: Interactive SVG canvas with animated laser paths and hazard heatmaps.
- [x] **Multi-Camera CCTV Grid**: 6 simulated surveillance feeds with AI bounding boxes and thermal mode.
- [x] **What-If Simulation Sandbox**: Scenario launcher and custom hazard parameter injector.
- [x] **Offline-Capable PWA**: Mobile evacuation interface with Service Worker caching and SOS beacon.
- [x] **Real-Time Communication**: Socket.io bidirectional event bus with live incident dispatching.
- [x] **Single-Command Launch**: `start-all.bat` and `start-all.ps1` for immediate evaluation.

---

Campus Sentinel © 2026. Built with ❤️ for Campus Safety and Autonomous Disaster Response.
