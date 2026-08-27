"""
Commander Agent - LangGraph State Orchestrator & Final Strategy Synthesizer
Coordinates all agent outputs into a unified tactical intelligence packet,
triggers Ollama reasoning, dispatches operational logs, and drives the SEE->ACT loop.
"""

import time
from typing import Dict, List, Any
try:
    from .ollama_reasoner import OllamaReasoner
except ImportError:
    from agents.ollama_reasoner import OllamaReasoner

class CommanderAgent:
    def __init__(self):
        self.reasoner = OllamaReasoner()
        self.decision_history: List[Dict[str, Any]] = []

    async def formulate_command_strategy(
        self,
        vision_data: Dict[str, Any],
        crowd_data: Dict[str, Any],
        hazard_data: Dict[str, Any],
        risk_data: Dict[str, Any],
        sim_data: Dict[str, Any],
        route_data: Dict[str, Any],
        resource_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Synthesizes comprehensive multi-agent telemetry and generates Commander Directives."""
        state_summary = {
            "threat_level": risk_data.get("campus_threat_level", "GREEN_NORMAL"),
            "max_risk": risk_data.get("max_risk_score", 0.0),
            "hazards": hazard_data.get("hazards_by_zone", []),
            "priority_zones": risk_data.get("priority_evacuation_zones", []),
            "impassable_zones": hazard_data.get("impassable_zones", []),
            "active_corridors": resource_data.get("active_corridors", []),
            "total_population": crowd_data.get("total_population", 0),
            "rerouted_zones_count": len(route_data.get("rerouted_zones", []))
        }

        # Invoke LLM / Intelligent Reasoner
        reasoning_output = await self.reasoner.generate_reasoning_and_orders(state_summary)

        # Build Commander decision record
        decision_record = {
            "timestamp": time.time(),
            "threat_level": state_summary["threat_level"],
            "max_risk_score": state_summary["max_risk"],
            "commander_source": reasoning_output.get("source"),
            "assessment": reasoning_output.get("situational_assessment"),
            "directives": reasoning_output.get("tactical_directives"),
            "pa_announcement": reasoning_output.get("public_address_announcement"),
            "agent_steps": reasoning_output.get("agent_steps", []),
            "confidence": reasoning_output.get("confidence_score", 0.95),
            "rerouted_zones": route_data.get("rerouted_zones", []),
            "evacuation_clearance_eta_min": sim_data.get("estimated_full_clearance_minutes", 6.0),
            "active_responders_count": resource_data.get("total_deployed_units", 0)
        }

        self.decision_history.append(decision_record)
        if len(self.decision_history) > 50:
            self.decision_history.pop(0)

        return decision_record
