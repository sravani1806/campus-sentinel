"""
Risk Assessment Agent - Dynamic Composite Zone Risk Scoring
Calculates comprehensive risk scores (0-100) per zone integrating
direct fire/smoke intensity, hazard proximity, crowd density, and exit availability.
"""

from typing import Dict, List, Any

class RiskAssessmentAgent:
    def __init__(self):
        pass

    def evaluate_campus_risks(self, hazard_data: Dict[str, Any], crowd_data: Dict[str, Any], campus_graph) -> Dict[str, Any]:
        """Calculates multi-dimensional risk scores across all campus zones."""
        zone_risks = {}
        campus_threat_level = "GREEN_NORMAL"
        max_risk_score = 0.0
        priority_evac_zones = []

        zone_analytics = crowd_data.get("zone_analytics", {})

        for node_id, data in campus_graph.graph.nodes(data=True):
            if data.get("is_exit", False):
                continue

            # 1. Base Hazard Factor (Direct Fire + Smoke)
            fire = data.get("fire_intensity", 0.0)
            smoke = data.get("smoke_density", 0.0)
            is_blocked = data.get("is_blocked", False)

            hazard_score = (fire * 0.6) + (smoke * 0.4)
            if is_blocked:
                hazard_score = max(hazard_score, 90.0)

            # 2. Proximity Factor (Hazards in adjacent connected zones)
            adjacent_hazard_penalty = 0.0
            neighbors = list(campus_graph.graph.neighbors(node_id))
            for neighbor in neighbors:
                n_data = campus_graph.graph.nodes[neighbor]
                n_fire = n_data.get("fire_intensity", 0.0)
                n_smoke = n_data.get("smoke_density", 0.0)
                if n_fire > 20 or n_smoke > 20:
                    adjacent_hazard_penalty += ((n_fire * 0.3) + (n_smoke * 0.2)) / max(1, len(neighbors))

            # 3. Crowd Density Factor
            crowd_info = zone_analytics.get(node_id, {})
            density_ratio = crowd_info.get("density_ratio", 0.2)
            crowd_penalty = density_ratio * 20.0 # up to +20 risk if crowded

            # Composite Dynamic Risk Score (0 - 100)
            composite_score = min(100.0, hazard_score + adjacent_hazard_penalty + crowd_penalty)
            composite_score = round(composite_score, 1)

            max_risk_score = max(max_risk_score, composite_score)

            if composite_score >= 70:
                threat_badge = "CRITICAL"
                priority_evac_zones.append(node_id)
            elif composite_score >= 45:
                threat_badge = "WARNING"
                priority_evac_zones.append(node_id)
            elif composite_score >= 20:
                threat_badge = "CAUTION"
            else:
                threat_badge = "SAFE"

            zone_risks[node_id] = {
                "zone_id": node_id,
                "name": data.get("name", node_id),
                "risk_score": composite_score,
                "threat_badge": threat_badge,
                "hazard_score": round(hazard_score, 1),
                "proximity_penalty": round(adjacent_hazard_penalty, 1),
                "crowd_penalty": round(crowd_penalty, 1),
                "current_occupancy": data.get("current_occupancy", 0),
                "floor": data.get("floor", 1)
            }

        # Overall Campus Threat Level
        if max_risk_score >= 75:
            campus_threat_level = "RED_CRITICAL"
        elif max_risk_score >= 45:
            campus_threat_level = "ORANGE_HIGH_ALERT"
        elif max_risk_score >= 20:
            campus_threat_level = "YELLOW_ELEVATED"
        else:
            campus_threat_level = "GREEN_NORMAL"

        return {
            "campus_threat_level": campus_threat_level,
            "max_risk_score": max_risk_score,
            "priority_evacuation_zones": priority_evac_zones,
            "zone_risk_matrix": zone_risks
        }
