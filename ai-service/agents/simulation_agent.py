"""
Simulation Agent - Evacuation Flow & Future Bottleneck Predictor
Runs predictive queue dynamics to forecast crowd congestion,
evacuation clearance curves, and critical chokepoints at T+1m, T+3m, T+5m.
"""

from typing import Dict, List, Any

class SimulationAgent:
    def __init__(self):
        pass

    def run_evacuation_forecast(self, crowd_data: Dict[str, Any], routes_data: Dict[str, Any], campus_graph) -> Dict[str, Any]:
        """Projects evacuation throughput and identifies future chokepoints."""
        total_initial_pop = crowd_data.get("total_population", 1200)
        zone_analytics = crowd_data.get("zone_analytics", {})

        # Compute egress flow capacity per exit gate
        gate_capacities = {
            "EXIT_NORTH_GATE": 180, # people per minute
            "EXIT_WEST_GATE": 150,
            "EXIT_EAST_GATE": 140,
            "EXIT_SOUTH_GATE": 220
        }

        # Projected evacuated people over time intervals (T+1 min, T+3 min, T+5 min, T+8 min)
        timeline_projections = []
        cumulative_evacuated = 0

        intervals = [
            {"time_min": 1, "label": "T+1 Min (Initial Surge)"},
            {"time_min": 3, "label": "T+3 Min (Peak Movement)"},
            {"time_min": 5, "label": "T+5 Min (Arterial Clearing)"},
            {"time_min": 8, "label": "T+8 Min (Complete Clearance)"}
        ]

        chokepoints = []

        # Count projected bottleneck areas
        for node_id, data in campus_graph.graph.nodes(data=True):
            if "STAIR" in node_id or "CORRIDOR" in node_id:
                occ = data.get("current_occupancy", 0)
                cap = max(1, data.get("capacity", 100))
                if occ / cap > 0.6:
                    chokepoints.append({
                        "node_id": node_id,
                        "name": data.get("name", node_id),
                        "congestion_risk": "HIGH_CHOKEPOINT",
                        "queue_delay_seconds": int(round((occ / cap) * 45))
                    })

        for step in intervals:
            t = step["time_min"]
            # S-curve sigmoid evacuation model
            rate = min(0.98, (1 / (1 + 2.718 ** (-0.7 * (t - 3.2)))))
            evacuated_count = int(total_initial_pop * rate)
            remaining_pop = max(0, total_initial_pop - evacuated_count)
            clearance_pct = round((evacuated_count / max(1, total_initial_pop)) * 100, 1)

            timeline_projections.append({
                "time_min": t,
                "label": step["label"],
                "evacuated_count": evacuated_count,
                "remaining_count": remaining_pop,
                "clearance_percent": clearance_pct
            })

        # Count active hazards and blocked corridors to calculate dynamic clearance ETA
        total_fire = 0
        total_smoke = 0
        blocked_nodes_count = 0
        for node_id, data in campus_graph.graph.nodes(data=True):
            total_fire += data.get("fire_intensity", 0)
            total_smoke += data.get("smoke_density", 0)
            if data.get("is_blocked", False):
                blocked_nodes_count += 1

        rerouted_count = len(routes_data.get("rerouted_zones", []))
        trapped_count = routes_data.get("trapped_zones_count", 0)

        # Baseline clearance time: 3.2 minutes under normal conditions
        if total_fire == 0 and total_smoke == 0 and blocked_nodes_count == 0 and rerouted_count == 0:
            full_clearance_time_min = 3.2
        elif total_fire > 100 or trapped_count > 0:
            full_clearance_time_min = round(12.5 + (blocked_nodes_count * 1.5) + (len(chokepoints) * 0.8), 1)
        elif total_fire > 50 or blocked_nodes_count >= 1:
            full_clearance_time_min = round(8.5 + (rerouted_count * 0.6) + (len(chokepoints) * 0.7), 1)
        elif total_smoke > 40:
            full_clearance_time_min = round(6.5 + (rerouted_count * 0.5), 1)
        else:
            full_clearance_time_min = round(4.8 + (len(chokepoints) * 0.5), 1)

        return {
            "initial_campus_population": total_initial_pop,
            "estimated_full_clearance_minutes": full_clearance_time_min,
            "predicted_chokepoints": chokepoints,
            "timeline_projections": timeline_projections
        }

