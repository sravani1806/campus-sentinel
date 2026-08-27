"""
Crowd Intelligence Agent - ByteTrack Flow & Congestion Analyzer
Estimates zone crowd densities, movement vectors, directional surges,
stampede/bottleneck risks, and flow rates.
"""

import time
from typing import Dict, List, Any

class CrowdIntelligenceAgent:
    def __init__(self):
        self.zone_densities: Dict[str, Dict[str, Any]] = {}

    def analyze_crowd_flow(self, vision_data: Dict[str, Any], campus_graph) -> Dict[str, Any]:
        """Analyzes crowd patterns across camera inputs and campus graph nodes."""
        analytics = {}
        total_campus_population = 0
        high_congestion_zones = []

        for node_id, data in campus_graph.graph.nodes(data=True):
            if data.get("is_exit", False):
                continue

            capacity = max(1, data.get("capacity", 100))
            current_occ = data.get("current_occupancy", 0)
            total_campus_population += current_occ

            density_ratio = round(current_occ / capacity, 2)
            
            # Determine crowd density status
            if density_ratio < 0.4:
                status = "LOW_DENSITY"
                risk_factor = 0.1
            elif density_ratio < 0.75:
                status = "MODERATE_DENSITY"
                risk_factor = 0.35
            elif density_ratio < 1.0:
                status = "HIGH_DENSITY"
                risk_factor = 0.7
                high_congestion_zones.append(node_id)
            else:
                status = "CRITICAL_CONGESTION"
                risk_factor = 1.0
                high_congestion_zones.append(node_id)

            # Movement vectors (directional velocity)
            # Simulated primary flow heading towards closest designated exits
            surge_speed = 1.2 if density_ratio < 0.8 else 0.4 # Slows down during bottleneck
            stampede_risk = round(min(1.0, max(0.0, (density_ratio - 0.7) * 2.5)), 2)

            analytics[node_id] = {
                "zone_id": node_id,
                "name": data.get("name", node_id),
                "occupancy": current_occ,
                "capacity": capacity,
                "density_ratio": density_ratio,
                "status": status,
                "flow_speed_mps": round(surge_speed, 2),
                "stampede_risk": stampede_risk,
                "is_bottleneck": density_ratio >= 0.85
            }

        return {
            "timestamp": time.time(),
            "total_population": total_campus_population,
            "high_congestion_zones": high_congestion_zones,
            "zone_analytics": analytics
        }
