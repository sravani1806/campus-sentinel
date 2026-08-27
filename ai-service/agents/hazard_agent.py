"""
Hazard Agent - Spatial Hazard & Impassability Evaluator
Monitors fire, smoke plume expansion, structural debris, and blocked exits.
Maintains hazard propagation rules and compromised path flags.
"""

from typing import Dict, List, Any

class HazardAgent:
    def __init__(self):
        self.active_incidents: List[Dict[str, Any]] = []

    def evaluate_hazards(self, active_hazards: Dict[str, Any], campus_graph) -> Dict[str, Any]:
        """Evaluates active hazard conditions and flags compromised nodes/edges in campus graph."""
        compromised_zones = []
        impassable_corridors = []
        total_fire_intensity = 0.0
        total_smoke_density = 0.0

        for zone_id, h in (active_hazards or {}).items():
            fire = float(h.get("fire", 0.0))
            smoke = float(h.get("smoke", 0.0))
            blocked = bool(h.get("blocked", False))

            if fire > 0 or smoke > 0 or blocked:
                total_fire_intensity += fire
                total_smoke_density += smoke

                severity = "LOW"
                if fire > 60 or smoke > 75 or blocked:
                    severity = "CRITICAL"
                elif fire > 30 or smoke > 40:
                    severity = "HIGH"
                elif fire > 10 or smoke > 20:
                    severity = "MODERATE"

                is_impassable = blocked or (fire >= 70.0) or (smoke >= 85.0)

                hazard_info = {
                    "zone_id": zone_id,
                    "fire_intensity": fire,
                    "smoke_density": smoke,
                    "is_blocked": blocked,
                    "is_impassable": is_impassable,
                    "severity": severity
                }
                compromised_zones.append(hazard_info)

                if is_impassable:
                    impassable_corridors.append(zone_id)

                # Update the campus graph node hazard state
                campus_graph.update_hazard_state(zone_id, fire, smoke, is_blocked=is_impassable)

        # Check if campus is in emergency state
        is_emergency = len(compromised_zones) > 0 or total_fire_intensity > 0 or total_smoke_density > 0

        return {
            "is_emergency_active": is_emergency,
            "compromised_zone_count": len(compromised_zones),
            "impassable_zones": impassable_corridors,
            "hazards_by_zone": compromised_zones,
            "aggregate_fire_intensity": round(total_fire_intensity, 1),
            "aggregate_smoke_density": round(total_smoke_density, 1)
        }
