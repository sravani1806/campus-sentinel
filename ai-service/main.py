"""
Campus Sentinel - Python AI & Routing Microservice (FastAPI)
Exposes REST and Streaming APIs for LangGraph multi-agent loop,
NetworkX dynamic A* routing, YOLOv11 CCTV synthesis, and Ollama LLM reasoning.
"""

import asyncio
import time
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from .agent_graph import MultiAgentSentinelWorkflow
except ImportError:
    from agent_graph import MultiAgentSentinelWorkflow

app = FastAPI(
    title="Campus Sentinel - AI & Routing Microservice",
    version="1.0.0",
    description="Agentic AI Multi-Agent Decision Engine & Autonomous Evacuation Routing"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

workflow = MultiAgentSentinelWorkflow()

# WebSockets connected clients (e.g. Node.js backend or direct UI)
active_websockets = []

class HazardPayload(BaseModel):
    zone_id: str
    fire: float = 0.0
    smoke: float = 0.0
    blocked: bool = False

class ScenarioPayload(BaseModel):
    scenario_id: str

@app.on_event("startup")
async def startup_event():
    # Run initial cycle
    await workflow.execute_cycle()
    # Start background loop for continuous autonomous surveillance
    asyncio.create_task(surveillance_background_loop())

async def surveillance_background_loop():
    """Continuously runs the multi-agent SEE->ACT loop and broadcasts updates."""
    while True:
        try:
            state = await workflow.execute_cycle()
            # Broadcast to connected WebSockets
            if active_websockets:
                for ws in list(active_websockets):
                    try:
                        await ws.send_json(state)
                    except Exception:
                        active_websockets.remove(ws)
        except Exception as e:
            print(f"[BackgroundLoop Error] {e}")
        await asyncio.sleep(2.0) # Run agent cycle every 2 seconds

@app.get("/")
async def root():
    return {
        "status": "ONLINE",
        "service": "Campus Sentinel AI & Routing Microservice",
        "version": "1.0.0",
        "docs_url": "/docs",
        "cycle_count": workflow.execution_cycle_count,
        "timestamp": time.time()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "ONLINE",
        "service": "Campus Sentinel AI & Routing Microservice",
        "cycle_count": workflow.execution_cycle_count,
        "timestamp": time.time()
    }

@app.get("/api/agent-state")
async def get_agent_state():
    """Returns the latest unified LangGraph multi-agent execution state."""
    if not workflow.last_execution_state:
        await workflow.execute_cycle()
    return workflow.last_execution_state

@app.post("/api/trigger-cycle")
async def trigger_cycle():
    """Forces an immediate multi-agent evaluation cycle."""
    state = await workflow.execute_cycle()
    return state

@app.post("/api/set-hazard")
async def set_hazard(payload: HazardPayload):
    """Injects or modifies a hazard condition in a campus zone."""
    workflow.set_hazard(payload.zone_id, payload.fire, payload.smoke, payload.blocked)
    state = await workflow.execute_cycle()
    return {
        "status": "SUCCESS",
        "message": f"Hazard updated for {payload.zone_id}",
        "new_state": state
    }

@app.post("/api/clear-hazards")
async def clear_hazards():
    """Resets all active campus hazards to zero."""
    workflow.clear_all_hazards()
    state = await workflow.execute_cycle()
    return {
        "status": "SUCCESS",
        "message": "All hazards cleared. Campus restored to nominal status.",
        "new_state": state
    }

@app.get("/api/route/{zone_id}")
async def get_zone_route(zone_id: str):
    """Returns the safest real-time evacuation route for a specific zone."""
    route_info = workflow.campus_graph.find_safest_evacuation_route(zone_id)
    return route_info

@app.get("/api/digital-twin")
async def get_digital_twin():
    """Returns full campus topology nodes, edges, coordinates, and hazard states."""
    return workflow.campus_graph.export_digital_twin_state()

@app.get("/api/cameras")
async def get_cameras():
    """Returns all camera streams with active detections and person tracking."""
    return workflow.vision_agent.process_frames(workflow.active_hazards)

@app.get("/api/camera-frame/{cam_id}")
async def get_camera_frame(cam_id: str):
    """Renders a dynamic JPEG snapshot of the camera feed with HUD and YOLO boxes."""
    jpeg_bytes = workflow.vision_agent.generate_synthetic_frame_jpeg(cam_id, workflow.active_hazards)
    return Response(content=jpeg_bytes, media_type="image/jpeg")

@app.post("/api/simulation/scenario")
async def trigger_scenario(payload: ScenarioPayload):
    """Triggers pre-configured emergency scenarios for What-If testing."""
    s_id = payload.scenario_id
    workflow.clear_all_hazards()

    if s_id in ["fire_science_block", "fire_emergency"]:
        workflow.set_hazard("BLOCK_B_L1", fire=85.0, smoke=90.0, blocked=True)
        workflow.set_hazard("CORRIDOR_EAST", fire=35.0, smoke=50.0, blocked=False)
    elif s_id in ["library_smoke_blockage", "smoke_detected"]:
        workflow.set_hazard("LIBRARY", fire=0.0, smoke=85.0, blocked=False)
        workflow.set_hazard("CORRIDOR_NORTH", fire=0.0, smoke=40.0, blocked=False)
    elif s_id in ["auditorium_surge_fire", "crowd_surge"]:
        workflow.set_hazard("CAFETERIA", fire=0.0, smoke=0.0, blocked=False)
        workflow.set_hazard("CORRIDOR_EAST", fire=0.0, smoke=0.0, blocked=False)
    elif s_id in ["gate_north_blocked", "blocked_exit"]:
        workflow.set_hazard("EXIT_NORTH_GATE", fire=0.0, smoke=0.0, blocked=True)
    elif s_id == "medical_emergency":
        workflow.set_hazard("CAFETERIA", fire=0.0, smoke=0.0, blocked=False)
    elif s_id == "blast_explosion":
        workflow.set_hazard("BLOCK_B_L1", fire=60.0, smoke=85.0, blocked=True)
        workflow.set_hazard("CORRIDOR_EAST", fire=20.0, smoke=40.0, blocked=True)
    elif s_id == "building_evacuation":
        workflow.set_hazard("BLOCK_A_L1", fire=0.0, smoke=0.0, blocked=False)
        workflow.set_hazard("STAIR_A", fire=0.0, smoke=0.0, blocked=False)
    elif s_id == "multi_point_disaster":
        workflow.set_hazard("BLOCK_A_L1", fire=75.0, smoke=80.0, blocked=True)
        workflow.set_hazard("BLOCK_B_L1", fire=60.0, smoke=70.0, blocked=False)
        workflow.set_hazard("CORRIDOR_NORTH", fire=45.0, smoke=60.0, blocked=True)


    state = await workflow.execute_cycle()
    return {
        "scenario": s_id,
        "status": "ACTIVATED",
        "state": state
    }

@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        # Send initial state immediately
        if workflow.last_execution_state:
            await websocket.send_json(workflow.last_execution_state)
        while True:
            # Keep socket alive and receive any client-injected control actions
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
