"""
Vision Agent - YOLOv11 & ByteTrack Computer Vision Processor
Simulates & processes multi-camera CCTV feeds, performs person detection,
fire/smoke detection, blocked exit classification, and renders synthetic frame streams.
"""

import time
import random
import cv2
import numpy as np
from typing import Dict, List, Any

class VisionAgent:
    def __init__(self):
        self.cameras = {
            "CAM_01": {
                "id": "CAM_01",
                "name": "Quadrangle Central Camera - North View",
                "zone_id": "QUADRANGLE",
                "status": "ONLINE",
                "fps": 30,
                "resolution": "1920x1080",
                "detected_people": 28,
                "detected_fire": False,
                "detected_smoke": False,
                "detected_blocked": False,
                "confidence_avg": 0.94
            },
            "CAM_02": {
                "id": "CAM_02",
                "name": "Central Library Main Hall",
                "zone_id": "LIBRARY",
                "status": "ONLINE",
                "fps": 30,
                "resolution": "1920x1080",
                "detected_people": 18,
                "detected_fire": False,
                "detected_smoke": False,
                "detected_blocked": False,
                "confidence_avg": 0.92
            },
            "CAM_03": {
                "id": "CAM_03",
                "name": "U Block - Lab Corridor",
                "zone_id": "BLOCK_B_L1",
                "status": "ONLINE",
                "fps": 30,
                "resolution": "1920x1080",
                "detected_people": 12,
                "detected_fire": False,
                "detected_smoke": False,
                "detected_blocked": False,
                "confidence_avg": 0.95
            },
            "CAM_04": {
                "id": "CAM_04",
                "name": "MHP Food Court",
                "zone_id": "CAFETERIA",
                "status": "ONLINE",
                "fps": 30,
                "resolution": "1920x1080",
                "detected_people": 35,
                "detected_fire": False,
                "detected_smoke": False,
                "detected_blocked": False,
                "confidence_avg": 0.91
            },
            "CAM_05": {
                "id": "CAM_05",
                "name": "A Block - Staircase",
                "zone_id": "STAIR_A",
                "status": "ONLINE",
                "fps": 30,
                "resolution": "1920x1080",
                "detected_people": 6,
                "detected_fire": False,
                "detected_smoke": False,
                "detected_blocked": False,
                "confidence_avg": 0.96
            },
            "CAM_06": {
                "id": "CAM_06",
                "name": "Main Gate Perimeter",
                "zone_id": "EXIT_EAST_GATE",
                "status": "ONLINE",
                "fps": 30,
                "resolution": "1920x1080",
                "detected_people": 2,
                "detected_fire": False,
                "detected_smoke": False,
                "detected_blocked": False,
                "confidence_avg": 0.98
            }
        }

    def process_frames(self, active_hazards: Dict[str, Any] = None) -> Dict[str, Any]:
        """Runs simulated YOLOv11 & ByteTrack detection pipeline across all active cameras."""
        active_hazards = active_hazards or {}
        detections = {}

        for cam_id, cam in self.cameras.items():
            zone = cam["zone_id"]
            zone_hazard = active_hazards.get(zone, {})
            fire_intensity = zone_hazard.get("fire", 0.0)
            smoke_density = zone_hazard.get("smoke", 0.0)
            is_blocked = zone_hazard.get("blocked", False)

            # Update camera state based on zone hazards
            cam["detected_fire"] = fire_intensity > 20.0
            cam["detected_smoke"] = smoke_density > 20.0
            cam["detected_blocked"] = is_blocked

            # Generate synthetic bounding boxes for people and hazards
            people_count = cam["detected_people"]
            # If fire, people flee or crowd surges
            if cam["detected_fire"]:
                people_count = max(0, people_count - random.randint(2, 6))
                cam["detected_people"] = people_count

            boxes = []
            # Generate person bounding boxes with ByteTrack IDs
            for i in range(min(people_count, 15)): # show up to 15 boxes for visualization
                bx = random.randint(50, 550)
                by = random.randint(100, 380)
                bw = random.randint(25, 45)
                bh = random.randint(60, 110)
                boxes.append({
                    "track_id": f"P-{100 + i}",
                    "label": "person",
                    "bbox": [bx, by, bw, bh],
                    "confidence": round(random.uniform(0.85, 0.98), 2),
                    "vector": [random.uniform(-1.5, 1.5), random.uniform(-1.0, 1.5)]
                })

            if cam["detected_fire"]:
                boxes.append({
                    "track_id": "HAZ-F1",
                    "label": "fire_hazard",
                    "bbox": [280, 180, 140, 160],
                    "confidence": round(min(0.99, 0.70 + (fire_intensity / 200)), 2),
                    "intensity": fire_intensity
                })

            if cam["detected_smoke"]:
                boxes.append({
                    "track_id": "HAZ-S1",
                    "label": "smoke_plume",
                    "bbox": [220, 80, 260, 200],
                    "confidence": round(min(0.98, 0.65 + (smoke_density / 200)), 2),
                    "density": smoke_density
                })

            if cam["detected_blocked"]:
                boxes.append({
                    "track_id": "HAZ-B1",
                    "label": "blocked_corridor",
                    "bbox": [150, 220, 180, 120],
                    "confidence": 0.96,
                    "severity": "CRITICAL_OBSTRUCTION"
                })

            detections[cam_id] = {
                "camera_id": cam_id,
                "name": cam["name"],
                "zone_id": zone,
                "timestamp": time.time(),
                "person_count": people_count,
                "has_fire": cam["detected_fire"],
                "has_smoke": cam["detected_smoke"],
                "is_blocked": cam["detected_blocked"],
                "fire_intensity": fire_intensity,
                "smoke_density": smoke_density,
                "bounding_boxes": boxes,
                "status": cam["status"]
            }

        return detections

    def generate_synthetic_frame_jpeg(self, cam_id: str, active_hazards: Dict[str, Any] = None) -> bytes:
        """Renders a dynamic visual surveillance frame with HUD, YOLO boxes, and ByteTrack overlay using OpenCV."""
        cam = self.cameras.get(cam_id, list(self.cameras.values())[0])
        zone_id = cam["zone_id"]
        zone_hazard = (active_hazards or {}).get(zone_id, {})
        has_fire = zone_hazard.get("fire", 0) > 20
        has_smoke = zone_hazard.get("smoke", 0) > 20
        is_blocked = zone_hazard.get("blocked", False)

        # Create canvas (640x360)
        img = np.zeros((360, 640, 3), dtype=np.uint8)

        # Background tint (CCTV night/day surveillance grid)
        img[:, :] = (18, 22, 28)

        # Draw simulated architectural perspective / perspective lines
        cv2.line(img, (0, 280), (640, 280), (45, 55, 65), 1)
        cv2.line(img, (120, 280), (220, 80), (40, 50, 60), 1)
        cv2.line(img, (520, 280), (420, 80), (40, 50, 60), 1)
        cv2.rectangle(img, (220, 80), (420, 280), (30, 38, 48), -1)
        cv2.rectangle(img, (220, 80), (420, 280), (60, 75, 90), 1)

        # If fire hazard present, render flame glowing effect
        if has_fire:
            fire_val = zone_hazard.get("fire", 50)
            overlay = img.copy()
            cv2.ellipse(overlay, (320, 220), (120, 80), 0, 0, 360, (15, 60, 240), -1) # Red/Orange core
            cv2.ellipse(overlay, (320, 200), (80, 50), 0, 0, 360, (20, 180, 255), -1) # Yellow core
            alpha = min(0.8, 0.4 + (fire_val / 200.0))
            cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)
            # YOLO Fire Bounding Box
            cv2.rectangle(img, (200, 130), (440, 270), (0, 0, 255), 2)
            cv2.putText(img, f"YOLOv11: FIRE {fire_val:.0f}%", (205, 122), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

        # If smoke present, render semi-transparent smoke cloud
        if has_smoke:
            smoke_val = zone_hazard.get("smoke", 50)
            smoke_overlay = img.copy()
            cv2.circle(smoke_overlay, (300, 130), 110, (130, 140, 140), -1)
            cv2.circle(smoke_overlay, (370, 110), 90, (110, 120, 120), -1)
            cv2.addWeighted(smoke_overlay, 0.45, img, 0.55, 0, img)
            cv2.putText(img, f"YOLOv11: SMOKE PLUME ({smoke_val:.0f}%)", (230, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

        # If blocked exit/corridor
        if is_blocked:
            cv2.rectangle(img, (240, 180), (400, 280), (0, 140, 255), 2)
            cv2.putText(img, "WARNING: PASSAGE OBSTRUCTED", (245, 172), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 140, 255), 2)

        # Render simulated people detection boxes with ByteTrack trails
        p_count = min(cam["detected_people"], 8)
        random.seed(int(time.time()) + int(cam_id[-1]))
        for i in range(p_count):
            px = 80 + (i * 65) + random.randint(-8, 8)
            py = 220 + (i % 3 * 25)
            pw = 28
            ph = 70
            # Box
            cv2.rectangle(img, (px, py), (px + pw, py + ph), (0, 255, 128), 1)
            # Label
            cv2.putText(img, f"ID:{100+i}", (px, py - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 128), 1)
            # Direction vector
            cv2.arrowedLine(img, (px + 14, py + 35), (px + 28, py + 35), (0, 255, 255), 1, tipLength=0.3)

        # Render HUD Overlay (Mission-control style)
        cv2.rectangle(img, (0, 0), (640, 32), (10, 12, 16), -1)
        cv2.line(img, (0, 32), (640, 32), (0, 255, 200), 1)

        # Timestamp & Camera Info
        t_str = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(img, f"SENTINEL-AI | {cam['id']}: {cam['name'][:24]}", (12, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 200), 1)
        cv2.putText(img, f"{t_str} | 30 FPS", (430, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (180, 200, 220), 1)

        # Bottom Bar HUD
        cv2.rectangle(img, (0, 332), (640, 360), (10, 12, 16), -1)
        status_color = (0, 0, 255) if (has_fire or is_blocked) else (0, 255, 128)
        status_text = "STATUS: HAZARD DETECTED" if (has_fire or is_blocked) else "STATUS: NORMAL / SECURE"
        cv2.putText(img, status_text, (12, 350), cv2.FONT_HERSHEY_SIMPLEX, 0.4, status_color, 1)
        cv2.putText(img, f"OCCUPANCY: {cam['detected_people']} PERS | BYTE-TRACK ACTIVE", (320, 350), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 220, 240), 1)

        # Encode to JPEG
        _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return buffer.tobytes()
