"""
Campus Sentinel - Digital Twin Graph & Dynamic A* Pathfinding Engine
Maintains the topological graph of the campus, dynamic edge weights,
congestion multipliers, hazard-impassability masks, and optimal route planning.
"""

import math
import networkx as nx
from typing import Dict, List, Any, Optional, Tuple

class CampusGraph:
    def __init__(self):
        self.graph = nx.Graph()
        self.nodes_data: Dict[str, Dict[str, Any]] = {}
        self.edges_data: Dict[Tuple[str, str], Dict[str, Any]] = {}
        self._initialize_campus_topology()

    def _initialize_campus_topology(self):
        """Initializes the baseline 2.5D campus digital twin layout and connections."""
        # 1. Define Nodes (Campus Zones & Junctions) with 2D/2.5D map coordinates (0-1000 x, 0-700 y)
        nodes = {
            # Admin Block
            "ADMIN_BLOCK": {
                "name": "Admin Block",
                "category": "admin",
                "x": 340, "y": 100, "floor": 1,
                "capacity": 200, "current_occupancy": 65,
                "is_exit": False, "description": "University Administration & Security Command"
            },

            # Academic Block
            "BLOCK_A_L1": {
                "name": "Academic Block (Floor 1)",
                "category": "academic",
                "x": 220, "y": 200, "floor": 1,
                "capacity": 400, "current_occupancy": 180,
                "is_exit": False, "description": "Lecture Halls A1-A6 & Faculty Offices"
            },
            "BLOCK_A_L2": {
                "name": "Academic Block (Floor 2)",
                "category": "academic",
                "x": 220, "y": 140, "floor": 2,
                "capacity": 300, "current_occupancy": 120,
                "is_exit": False, "description": "Computer Science & AI Labs"
            },
            "STAIR_A": {
                "name": "A Block",
                "category": "stairwell",
                "x": 280, "y": 170, "floor": 1,
                "capacity": 150, "current_occupancy": 15,
                "is_exit": False, "description": "Pressurized Concrete Fire Staircase"
            },

            # N Block / U Block
            "BLOCK_B_L1": {
                "name": "U Block",
                "category": "science",
                "x": 780, "y": 200, "floor": 1,
                "capacity": 350, "current_occupancy": 140,
                "is_exit": False, "description": "Chemistry & Physics Research Labs"
            },
            "BLOCK_B_L2": {
                "name": "N Block (Floor 2)",
                "category": "science",
                "x": 780, "y": 140, "floor": 2,
                "capacity": 250, "current_occupancy": 90,
                "is_exit": False, "description": "Advanced Robotics & Microelectronics"
            },
            "STAIR_B": {
                "name": "N Block Stairwell",
                "category": "stairwell",
                "x": 720, "y": 170, "floor": 1,
                "capacity": 150, "current_occupancy": 20,
                "is_exit": False, "description": "Reinforced Fire Staircase"
            },

            # Central Facilities & Library
            "LIBRARY": {
                "name": "Central Library",
                "category": "library",
                "x": 500, "y": 180, "floor": 1,
                "capacity": 500, "current_occupancy": 210,
                "is_exit": False, "description": "Multi-tier Reading Hall & Digital Archives"
            },
            "AUDITORIUM": {
                "name": "Grand Auditorium",
                "category": "event",
                "x": 220, "y": 480, "floor": 1,
                "capacity": 800, "current_occupancy": 320,
                "is_exit": False, "description": "Main Convocation Hall & Theatres"
            },
            "CAFETERIA": {
                "name": "MHP",
                "category": "dining",
                "x": 780, "y": 480, "floor": 1,
                "capacity": 450, "current_occupancy": 195,
                "is_exit": False, "description": "MHP Food Court & Student Gathering Hall"
            },
            "QUADRANGLE": {
                "name": "Central Quadrangle Plaza",
                "category": "outdoor",
                "x": 500, "y": 360, "floor": 1,
                "capacity": 1200, "current_occupancy": 280,
                "is_exit": False, "description": "Open-air Assembly Plaza & Green Lawn"
            },
            "HOSTEL_HUB": {
                "name": "Student Hostels",
                "category": "residential",
                "x": 500, "y": 550, "floor": 1,
                "capacity": 600, "current_occupancy": 150,
                "is_exit": False, "description": "Hostel Quadrangle & Dormitory Link"
            },
            "MEDICAL_CENTER": {
                "name": "Medical Center & Clinic",
                "category": "medical",
                "x": 860, "y": 100, "floor": 1,
                "capacity": 150, "current_occupancy": 30,
                "is_exit": False, "description": "Emergency First Aid & Health Center"
            },
            "SPORTS_COMPLEX": {
                "name": "Sports Complex & Arena",
                "category": "sports",
                "x": 340, "y": 620, "floor": 1,
                "capacity": 700, "current_occupancy": 110,
                "is_exit": False, "description": "Indoor Gymnasium, Pool & Athletic Arena"
            },

            # Corridors & Arterial Connectors
            "CORRIDOR_NORTH": {
                "name": "North Skyway Promenade",
                "category": "corridor",
                "x": 500, "y": 270, "floor": 1,
                "capacity": 300, "current_occupancy": 45,
                "is_exit": False, "description": "Covered Walkway connecting Academic, Library, and N blocks"
            },
            "CORRIDOR_WEST": {
                "name": "West Arterial Corridor",
                "category": "corridor",
                "x": 340, "y": 360, "floor": 1,
                "capacity": 250, "current_occupancy": 30,
                "is_exit": False, "description": "Walkway connecting Academic Block, Quadrangle, and Auditorium"
            },
            "CORRIDOR_EAST": {
                "name": "East Arterial Corridor",
                "category": "corridor",
                "x": 660, "y": 360, "floor": 1,
                "capacity": 250, "current_occupancy": 35,
                "is_exit": False, "description": "Walkway connecting U Block, Quadrangle, and MHP"
            },
            "CORRIDOR_SOUTH": {
                "name": "South Boulevard",
                "category": "corridor",
                "x": 500, "y": 460, "floor": 1,
                "capacity": 350, "current_occupancy": 50,
                "is_exit": False, "description": "Boulevard connecting Auditorium, Hostels, and MHP"
            },

            # Designated Safe Exits & Medical Bays
            "EXIT_NORTH_GATE": {
                "name": "Main Gate (North Highway)",
                "category": "exit",
                "x": 500, "y": 60, "floor": 1,
                "capacity": 2500, "current_occupancy": 0,
                "is_exit": True, "description": "Primary Campus Entrance & Arterial Highway Gate"
            },
            "EXIT_WEST_GATE": {
                "name": "West Perimeter Exit",
                "category": "exit",
                "x": 70, "y": 360, "floor": 1,
                "capacity": 1500, "current_occupancy": 0,
                "is_exit": True, "description": "Rapid Evacuation Point to Open Parking Grounds"
            },
            "EXIT_EAST_GATE": {
                "name": "Main Gate",
                "category": "exit",
                "x": 930, "y": 360, "floor": 1,
                "capacity": 1500, "current_occupancy": 0,
                "is_exit": True, "description": "Direct Access to Medical Bay & Municipal Hospital Route"
            },
            "EXIT_SOUTH_GATE": {
                "name": "South Gate (Sports Exit)",
                "category": "exit",
                "x": 500, "y": 660, "floor": 1,
                "capacity": 2500, "current_occupancy": 0,
                "is_exit": True, "description": "Wide Open Field Staging Area & Sports Gate"
            },
            "AMBULANCE_BAY": {
                "name": "First Responder / Ambulance Bay",
                "category": "emergency_staging",
                "x": 930, "y": 200, "floor": 1,
                "capacity": 200, "current_occupancy": 10,
                "is_exit": False, "description": "Staging Area for Fire Engines & Paramedics"
            }
        }

        # Add Nodes to Graph
        for node_id, data in nodes.items():
            self.graph.add_node(
                node_id,
                **data,
                risk_score=0.0,
                hazard_level="SAFE",
                fire_intensity=0.0,
                smoke_density=0.0,
                is_blocked=False
            )
            self.nodes_data[node_id] = self.graph.nodes[node_id]

        # 2. Define Baseline Edges (Connections between zones)
        edges = [
            # Vertical connections
            ("BLOCK_A_L2", "STAIR_A", {"width": 3.0, "type": "stairs"}),
            ("STAIR_A", "BLOCK_A_L1", {"width": 3.0, "type": "stairs"}),
            ("BLOCK_B_L2", "STAIR_B", {"width": 3.0, "type": "stairs"}),
            ("STAIR_B", "BLOCK_B_L1", {"width": 3.0, "type": "stairs"}),

            # Admin & Medical Links
            ("ADMIN_BLOCK", "EXIT_NORTH_GATE", {"width": 5.0, "type": "main_avenue"}),
            ("ADMIN_BLOCK", "BLOCK_A_L1", {"width": 4.0, "type": "walkway"}),
            ("ADMIN_BLOCK", "LIBRARY", {"width": 4.5, "type": "walkway"}),
            ("MEDICAL_CENTER", "EXIT_NORTH_GATE", {"width": 5.0, "type": "avenue"}),
            ("MEDICAL_CENTER", "BLOCK_B_L1", {"width": 4.0, "type": "walkway"}),
            ("MEDICAL_CENTER", "AMBULANCE_BAY", {"width": 6.0, "type": "responder_lane"}),

            # Block A connections
            ("BLOCK_A_L1", "CORRIDOR_NORTH", {"width": 4.5, "type": "corridor"}),
            ("BLOCK_A_L1", "CORRIDOR_WEST", {"width": 4.0, "type": "corridor"}),
            ("BLOCK_A_L1", "EXIT_WEST_GATE", {"width": 5.0, "type": "path"}),

            # Library connections
            ("LIBRARY", "CORRIDOR_NORTH", {"width": 6.0, "type": "corridor"}),
            ("LIBRARY", "EXIT_NORTH_GATE", {"width": 6.0, "type": "main_exit_route"}),
            ("LIBRARY", "QUADRANGLE", {"width": 5.0, "type": "plaza_link"}),

            # U Block connections
            ("BLOCK_B_L1", "CORRIDOR_NORTH", {"width": 4.5, "type": "corridor"}),
            ("BLOCK_B_L1", "CORRIDOR_EAST", {"width": 4.0, "type": "corridor"}),
            ("BLOCK_B_L1", "EXIT_EAST_GATE", {"width": 5.0, "type": "path"}),
            ("BLOCK_B_L1", "AMBULANCE_BAY", {"width": 6.0, "type": "responder_lane"}),
            ("AMBULANCE_BAY", "EXIT_EAST_GATE", {"width": 6.0, "type": "responder_lane"}),

            # Quadrangle Hub connections
            ("QUADRANGLE", "CORRIDOR_NORTH", {"width": 5.0, "type": "plaza_link"}),
            ("QUADRANGLE", "CORRIDOR_WEST", {"width": 5.0, "type": "plaza_link"}),
            ("QUADRANGLE", "CORRIDOR_EAST", {"width": 5.0, "type": "plaza_link"}),
            ("QUADRANGLE", "CORRIDOR_SOUTH", {"width": 5.0, "type": "plaza_link"}),

            # Auditorium connections
            ("AUDITORIUM", "CORRIDOR_WEST", {"width": 5.0, "type": "corridor"}),
            ("AUDITORIUM", "CORRIDOR_SOUTH", {"width": 4.5, "type": "corridor"}),
            ("AUDITORIUM", "EXIT_WEST_GATE", {"width": 6.0, "type": "wide_exit_route"}),

            # MHP connections
            ("CAFETERIA", "CORRIDOR_EAST", {"width": 5.0, "type": "corridor"}),
            ("CAFETERIA", "CORRIDOR_SOUTH", {"width": 4.5, "type": "corridor"}),
            ("CAFETERIA", "EXIT_EAST_GATE", {"width": 6.0, "type": "wide_exit_route"}),

            # Sports Complex Links
            ("SPORTS_COMPLEX", "AUDITORIUM", {"width": 4.5, "type": "walkway"}),
            ("SPORTS_COMPLEX", "CORRIDOR_SOUTH", {"width": 4.5, "type": "walkway"}),
            ("SPORTS_COMPLEX", "EXIT_SOUTH_GATE", {"width": 6.0, "type": "wide_exit_route"}),

            # Hostel Hub & South Connections
            ("HOSTEL_HUB", "CORRIDOR_SOUTH", {"width": 4.5, "type": "walkway"}),
            ("HOSTEL_HUB", "EXIT_SOUTH_GATE", {"width": 6.0, "type": "main_exit_route"}),
            ("AUDITORIUM", "EXIT_SOUTH_GATE", {"width": 5.0, "type": "path"}),
            ("CAFETERIA", "EXIT_SOUTH_GATE", {"width": 5.0, "type": "path"}),

            # Direct Perimeter connectors
            ("CORRIDOR_WEST", "EXIT_WEST_GATE", {"width": 4.5, "type": "path"}),
            ("CORRIDOR_EAST", "EXIT_EAST_GATE", {"width": 4.5, "type": "path"}),
            ("CORRIDOR_NORTH", "EXIT_NORTH_GATE", {"width": 5.0, "type": "path"}),
            ("CORRIDOR_SOUTH", "EXIT_SOUTH_GATE", {"width": 5.0, "type": "path"})
        ]

        for u, v, attrs in edges:
            node_u = self.nodes_data[u]
            node_v = self.nodes_data[v]
            # Euclidean base distance in meter equivalent
            dist = math.sqrt((node_u["x"] - node_v["x"])**2 + (node_u["y"] - node_v["y"])**2)
            if node_u.get("floor", 1) != node_v.get("floor", 1):
                dist += 25.0 # Stair elevation traversal penalty

            edge_dict = {
                "base_distance": round(dist, 1),
                "width": attrs.get("width", 4.0),
                "type": attrs.get("type", "corridor"),
                "is_blocked": False,
                "fire_hazard": 0.0,
                "smoke_hazard": 0.0,
                "congestion_level": 0.1, # 0.0 to 1.0
                "dynamic_weight": round(dist, 1),
                "is_emergency_corridor": False
            }
            self.graph.add_edge(u, v, **edge_dict)
            self.edges_data[(u, v)] = edge_dict
            self.edges_data[(v, u)] = edge_dict

    def update_hazard_state(self, zone_id: str, fire: float, smoke: float, is_blocked: bool = False):
        """Updates fire, smoke, and blocked state for a specific zone and recalculates dynamic weights."""
        if zone_id in self.graph.nodes:
            self.graph.nodes[zone_id]["fire_intensity"] = max(0.0, min(100.0, fire))
            self.graph.nodes[zone_id]["smoke_density"] = max(0.0, min(100.0, smoke))
            self.graph.nodes[zone_id]["is_blocked"] = is_blocked or (fire >= 75.0)

            # Recalculate node risk score (0-100)
            risk = (fire * 0.6) + (smoke * 0.4)
            if is_blocked:
                risk = 100.0
            self.graph.nodes[zone_id]["risk_score"] = round(risk, 1)

            if risk < 25:
                self.graph.nodes[zone_id]["hazard_level"] = "SAFE"
            elif risk < 50:
                self.graph.nodes[zone_id]["hazard_level"] = "CAUTION"
            elif risk < 75:
                self.graph.nodes[zone_id]["hazard_level"] = "WARNING"
            else:
                self.graph.nodes[zone_id]["hazard_level"] = "CRITICAL"

            self._recalculate_all_edge_weights()

    def update_crowd_occupancy(self, zone_id: str, occupancy: int):
        """Updates crowd count and congestion for a zone."""
        if zone_id in self.graph.nodes:
            cap = max(1, self.graph.nodes[zone_id]["capacity"])
            self.graph.nodes[zone_id]["current_occupancy"] = max(0, occupancy)
            congestion = min(2.0, occupancy / cap)

            # Propagate congestion to connected edges
            for neighbor in self.graph.neighbors(zone_id):
                edge_data = self.graph[zone_id][neighbor]
                edge_data["congestion_level"] = round(congestion, 2)

            self._recalculate_all_edge_weights()

    def set_emergency_corridor(self, path: List[str]):
        """Flags an active route as a priority ambulance/responder corridor."""
        # Reset previous corridor flags
        for u, v, d in self.graph.edges(data=True):
            d["is_emergency_corridor"] = False

        if path and len(path) > 1:
            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                if self.graph.has_edge(u, v):
                    self.graph[u][v]["is_emergency_corridor"] = True

    def _recalculate_all_edge_weights(self):
        """Recalculates dynamic routing weights using cost function incorporating hazards and congestion."""
        for u, v, d in self.graph.edges(data=True):
            node_u = self.graph.nodes[u]
            node_v = self.graph.nodes[v]

            # If either node or the edge itself is blocked, set near infinite cost
            if node_u.get("is_blocked", False) or node_v.get("is_blocked", False) or d.get("is_blocked", False):
                d["dynamic_weight"] = 1e7
                continue

            base_d = d["base_distance"]
            width = max(1.0, d.get("width", 3.0))

            # Hazard penalties from both endpoints
            avg_risk = (node_u.get("risk_score", 0.0) + node_v.get("risk_score", 0.0)) / 2.0
            hazard_multiplier = 1.0 + (avg_risk / 10.0) ** 1.8 # Exponential penalty for dangerous zones

            # Congestion and capacity penalty
            congestion = d.get("congestion_level", 0.1)
            congestion_multiplier = 1.0 + (congestion * 4.0 / width)

            # Emergency corridor penalty for general pedestrian flow (so civilians avoid responder corridors)
            responder_penalty = 3.0 if d.get("is_emergency_corridor", False) else 1.0

            final_weight = base_d * hazard_multiplier * congestion_multiplier * responder_penalty
            d["dynamic_weight"] = round(final_weight, 2)

    def find_safest_evacuation_route(self, start_zone: str) -> Dict[str, Any]:
        """Uses A* Algorithm with Euclidean heuristic to find the safest route to an optimal exit gate."""
        if start_zone not in self.graph.nodes:
            return {"error": f"Zone {start_zone} not found", "path": [], "cost": 0}

        exits = [n for n, d in self.graph.nodes(data=True) if d.get("is_exit", False) and not d.get("is_blocked", False)]
        if not exits:
            return {"error": "No safe unblocked exits found in campus network", "path": [], "cost": 0}

        def heuristic(u, v):
            nu = self.graph.nodes[u]
            nv = self.graph.nodes[v]
            return math.sqrt((nu["x"] - nv["x"])**2 + (nu["y"] - nv["y"])**2)

        best_path = None
        best_cost = float("inf")
        chosen_exit = None

        for target_exit in exits:
            try:
                path = nx.astar_path(self.graph, start_zone, target_exit, heuristic=heuristic, weight="dynamic_weight")
                cost = nx.astar_path_length(self.graph, start_zone, target_exit, weight="dynamic_weight")
                if cost < best_cost and cost < 1e6:
                    best_cost = cost
                    best_path = path
                    chosen_exit = target_exit
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                continue

        if not best_path:
            return {
                "start": start_zone,
                "exit": None,
                "path": [],
                "cost": 0,
                "status": "TRAPPED_NO_PATH",
                "message": "All paths compromised or blocked by hazard!"
            }

        # Calculate estimated evacuation time (EET) in seconds assuming 1.2 m/s average speed
        eet_seconds = round((best_cost / 1.2), 0)

        # Generate human-readable step-by-step guidance
        steps = []
        for i in range(len(best_path) - 1):
            curr_node = self.graph.nodes[best_path[i]]
            next_node = self.graph.nodes[best_path[i+1]]
            steps.append(f"Proceed from {curr_node['name']} towards {next_node['name']}")
        steps.append(f"Arrive safely at {self.graph.nodes[chosen_exit]['name']}")

        return {
            "start": start_zone,
            "exit": chosen_exit,
            "exit_name": self.graph.nodes[chosen_exit]["name"],
            "path": best_path,
            "cost": round(best_cost, 1),
            "estimated_time_seconds": int(eet_seconds),
            "steps": steps,
            "status": "OPTIMAL"
        }

    def compute_all_zone_evacuations(self) -> Dict[str, Any]:
        """Calculates dynamic evacuation routes for every occupied zone in the campus."""
        results = {}
        for node_id, data in self.graph.nodes(data=True):
            if not data.get("is_exit", False) and data.get("current_occupancy", 0) > 0:
                results[node_id] = self.find_safest_evacuation_route(node_id)
        return results

    def find_emergency_responder_corridor(self, target_zone: str) -> Dict[str, Any]:
        """Calculates clear corridor for ambulances and firefighters starting from AMBULANCE_BAY."""
        start_node = "AMBULANCE_BAY"
        if start_node not in self.graph.nodes or target_zone not in self.graph.nodes:
            return {"path": [], "status": "ERROR"}

        try:
            # For emergency vehicles, use base distance without general pedestrian congestion penalties
            path = nx.shortest_path(self.graph, start_node, target_zone, weight="base_distance")
            self.set_emergency_corridor(path)
            return {
                "origin": start_node,
                "destination": target_zone,
                "path": path,
                "status": "ACTIVE_CORRIDOR"
            }
        except nx.NetworkXNoPath:
            return {"path": [], "status": "BLOCKED"}

    def export_digital_twin_state(self) -> Dict[str, Any]:
        """Exports the full graph state, nodes, edges, hazards, and coordinates for frontend rendering."""
        nodes_list = []
        for n, d in self.graph.nodes(data=True):
            nodes_list.append({
                "id": n,
                "name": d.get("name", n),
                "category": d.get("category", "zone"),
                "x": d.get("x", 0),
                "y": d.get("y", 0),
                "floor": d.get("floor", 1),
                "capacity": d.get("capacity", 100),
                "current_occupancy": d.get("current_occupancy", 0),
                "risk_score": d.get("risk_score", 0.0),
                "hazard_level": d.get("hazard_level", "SAFE"),
                "fire_intensity": d.get("fire_intensity", 0.0),
                "smoke_density": d.get("smoke_density", 0.0),
                "is_blocked": d.get("is_blocked", False),
                "is_exit": d.get("is_exit", False),
                "description": d.get("description", "")
            })

        edges_list = []
        for u, v, d in self.graph.edges(data=True):
            edges_list.append({
                "source": u,
                "target": v,
                "base_distance": d.get("base_distance", 0),
                "dynamic_weight": d.get("dynamic_weight", 0),
                "is_blocked": d.get("is_blocked", False),
                "congestion_level": d.get("congestion_level", 0.1),
                "is_emergency_corridor": d.get("is_emergency_corridor", False),
                "type": d.get("type", "corridor")
            })

        return {
            "nodes": nodes_list,
            "edges": edges_list
        }
