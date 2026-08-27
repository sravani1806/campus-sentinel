"""
Campus Sentinel - LangGraph Multi-Agent Orchestrator
Defines the cyclical state graph:
SEE (Vision) -> UNDERSTAND (Crowd + Hazard) -> PREDICT (Risk) -> SIMULATE (Simulation) -> REPLAN (Route + Resource) -> ACT (Commander + LLM)
"""

import time
import asyncio
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

try:
    from .campus_graph import CampusGraph
    from .agents.vision_agent import VisionAgent
    from .agents.crowd_agent import CrowdIntelligenceAgent
    from .agents.hazard_agent import HazardAgent
    from .agents.risk_agent import RiskAssessmentAgent
    from .agents.simulation_agent import SimulationAgent
    from .agents.route_agent import RoutePlanningAgent
    from .agents.resource_agent import ResourceAgent
    from .agents.commander_agent import CommanderAgent
except ImportError:
    from campus_graph import CampusGraph
    from agents.vision_agent import VisionAgent
    from agents.crowd_agent import CrowdIntelligenceAgent
    from agents.hazard_agent import HazardAgent
    from agents.risk_agent import RiskAssessmentAgent
    from agents.simulation_agent import SimulationAgent
    from agents.route_agent import RoutePlanningAgent
    from agents.resource_agent import ResourceAgent
    from agents.commander_agent import CommanderAgent

class MultiAgentSentinelWorkflow:
    def __init__(self):
        self.campus_graph = CampusGraph()
        self.vision_agent = VisionAgent()
        self.crowd_agent = CrowdIntelligenceAgent()
        self.hazard_agent = HazardAgent()
        self.risk_agent = RiskAssessmentAgent()
        self.simulation_agent = SimulationAgent()
        self.route_agent = RoutePlanningAgent()
        self.resource_agent = ResourceAgent()
        self.commander_agent = CommanderAgent()

        # State storage
        self.active_hazards: Dict[str, Any] = {}
        self.last_execution_state: Dict[str, Any] = {}
        self.execution_cycle_count: int = 0

    def set_hazard(self, zone_id: str, fire: float = 0.0, smoke: float = 0.0, blocked: bool = False):
        """Injects or clears an active hazard condition (e.g. from What-If Simulation or Vision feed)."""
        if fire <= 0 and smoke <= 0 and not blocked:
            if zone_id in self.active_hazards:
                del self.active_hazards[zone_id]
        else:
            self.active_hazards[zone_id] = {
                "fire": max(0.0, min(100.0, fire)),
                "smoke": max(0.0, min(100.0, smoke)),
                "blocked": blocked
            }

    def clear_all_hazards(self):
        """Resets all active campus hazards to zero."""
        self.active_hazards.clear()
        # Reset graph state
        self.campus_graph._initialize_campus_topology()

    async def execute_cycle(self) -> Dict[str, Any]:
        """Executes one complete LangGraph multi-agent decision cycle: SEE -> UNDERSTAND -> PREDICT -> SIMULATE -> REPLAN -> ACT."""
        start_time = time.time()
        self.execution_cycle_count += 1

        # Node 1: SEE - Vision Agent (YOLOv11 & ByteTrack analysis)
        vision_output = self.vision_agent.process_frames(self.active_hazards)

        # Node 2: UNDERSTAND - Hazard Evaluation & Crowd Flow
        hazard_output = self.hazard_agent.evaluate_hazards(self.active_hazards, self.campus_graph)
        crowd_output = self.crowd_agent.analyze_crowd_flow(vision_output, self.campus_graph)

        # Node 3: PREDICT - Dynamic Zone Risk Assessment
        risk_output = self.risk_agent.evaluate_campus_risks(hazard_output, crowd_output, self.campus_graph)

        # Node 4: REPLAN - NetworkX Dynamic A* Route Planning
        route_output = self.route_agent.plan_all_routes(self.campus_graph)

        # Node 5: SIMULATE - Predictive Congestion & Clearance Bottleneck Modeling
        sim_output = self.simulation_agent.run_evacuation_forecast(crowd_output, route_output, self.campus_graph)

        # Node 6: RESOURCE - Ambulance & First Responder Corridor Allocation
        resource_output = self.resource_agent.coordinate_resources(risk_output, self.campus_graph)

        # Node 7: ACT - Commander Agent + Local Ollama LLM Reasoning
        commander_output = await self.commander_agent.formulate_command_strategy(
            vision_output, crowd_output, hazard_output, risk_output, sim_output, route_output, resource_output
        )

        cycle_duration_ms = round((time.time() - start_time) * 1000, 2)

        # Digital Twin Topology
        digital_twin = self.campus_graph.export_digital_twin_state()

        unified_state = {
            "cycle_id": self.execution_cycle_count,
            "timestamp": time.time(),
            "cycle_duration_ms": cycle_duration_ms,
            "stage_status": {
                "SEE": "COMPLETED (YOLOv11 & ByteTrack)",
                "UNDERSTAND": "COMPLETED (Spatial Hazards & Crowd Flow)",
                "PREDICT": "COMPLETED (Multi-factor Risk Matrix)",
                "SIMULATE": "COMPLETED (Queue Dynamics & Forecast)",
                "REPLAN": "COMPLETED (Dynamic A* Graphs)",
                "ACT": "COMPLETED (Commander & Ollama Directive)"
            },
            "threat_level": risk_output["campus_threat_level"],
            "max_risk_score": risk_output["max_risk_score"],
            "vision": vision_output,
            "hazards": hazard_output,
            "crowd": crowd_output,
            "risks": risk_output,
            "simulation": sim_output,
            "routes": route_output,
            "resources": resource_output,
            "commander": commander_output,
            "digital_twin": digital_twin
        }

        self.last_execution_state = unified_state
        return unified_state
