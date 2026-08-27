"""
Resource Agent - First Responder & Emergency Vehicle Corridor Coordinator
Maintains ambulance lanes, fire engine access corridors, responder staging,
and live dispatch unit tracking.
"""

from typing import Dict, List, Any

class ResourceAgent:
    def __init__(self):
        self.responder_units = [
            {
                "id": "FIRE_TRUCK_ALPHA",
                "name": "Fire Engine Alpha (Heavy Pumper)",
                "type": "FIRE",
                "status": "DISPATCHED",
                "assigned_zone": "BLOCK_B_L1",
                "eta_minutes": 2.5
            },
            {
                "id": "AMBULANCE_01",
                "name": "Rapid Response Paramedic Unit 1",
                "type": "MEDICAL",
                "status": "STAGED",
                "assigned_zone": "AMBULANCE_BAY",
                "eta_minutes": 0.0
            },
            {
                "id": "AMBULANCE_02",
                "name": "Advanced Life Support Ambulance 2",
                "type": "MEDICAL",
                "status": "EN_ROUTE",
                "assigned_zone": "EXIT_EAST_GATE",
                "eta_minutes": 4.0
            },
            {
                "id": "SECURITY_QRF",
                "name": "Campus Quick Reaction Force (QRF)",
                "type": "SECURITY",
                "status": "DEPLOYED",
                "assigned_zone": "QUADRANGLE",
                "eta_minutes": 1.0
            }
        ]

    def coordinate_resources(self, risk_data: Dict[str, Any], campus_graph) -> Dict[str, Any]:
        """Plans emergency vehicle paths and flags protected corridors."""
        priority_zones = risk_data.get("priority_evacuation_zones", [])
        active_corridors = []

        if priority_zones:
            target_incident_zone = priority_zones[0]
            corridor_result = campus_graph.find_emergency_responder_corridor(target_incident_zone)
            if corridor_result.get("status") == "ACTIVE_CORRIDOR":
                active_corridors.append(corridor_result)
        else:
            # Clear corridor to default quadrangle
            corridor_result = campus_graph.find_emergency_responder_corridor("QUADRANGLE")
            if corridor_result.get("status") == "ACTIVE_CORRIDOR":
                active_corridors.append(corridor_result)

        return {
            "active_corridors": active_corridors,
            "responder_units": self.responder_units,
            "total_deployed_units": len([u for u in self.responder_units if u["status"] in ("DISPATCHED", "DEPLOYED", "EN_ROUTE")]),
            "staging_bay_status": "OPERATIONAL"
        }
