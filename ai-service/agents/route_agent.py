"""
Route Planning Agent - NetworkX & Dynamic A* Autonomous Pathfinding
Calculates zone-by-zone optimal evacuation trajectories, avoids compromised
nodes/edges, minimizes congestion bottlenecks, and tracks reroute actions.
"""

from typing import Dict, List, Any

class RoutePlanningAgent:
    def __init__(self):
        self.last_routes: Dict[str, Any] = {}

    def plan_all_routes(self, campus_graph) -> Dict[str, Any]:
        """Calculates dynamic evacuation routes for every active zone on campus."""
        zone_routes = campus_graph.compute_all_zone_evacuations()
        
        # Determine exit load distribution
        exit_allocation = {}
        total_trapped = 0
        rerouted_zones = []

        for zone_id, route in zone_routes.items():
            if route.get("status") == "TRAPPED_NO_PATH":
                total_trapped += 1
                continue

            target_exit = route.get("exit")
            if target_exit:
                exit_allocation[target_exit] = exit_allocation.get(target_exit, 0) + 1

            # Check if route changed compared to last evaluation
            if zone_id in self.last_routes:
                old_path = self.last_routes[zone_id].get("path", [])
                new_path = route.get("path", [])
                if old_path != new_path:
                    rerouted_zones.append({
                        "zone_id": zone_id,
                        "old_exit": self.last_routes[zone_id].get("exit"),
                        "new_exit": target_exit,
                        "reason": "Dynamic hazard replanning activated"
                    })

        self.last_routes = zone_routes

        return {
            "total_active_routes": len(zone_routes),
            "trapped_zones_count": total_trapped,
            "exit_distribution": exit_allocation,
            "rerouted_zones": rerouted_zones,
            "routes_by_zone": zone_routes
        }
