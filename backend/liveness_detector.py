"""
Liveness Detection Module for Anti-Spoofing
Uses OpenCV Haar Cascades for blink detection and frame variation analysis
"""

import cv2
import numpy as np
import base64
from typing import List, Dict, Tuple
import os

class LivenessDetector:
    """
    Detects liveness using blink detection and frame variation analysis
    to prevent photo/video spoofing attacks
    """
    
    def __init__(self):
        """Initialize Haar Cascade classifiers"""
        # Get OpenCV data path
        cv2_base_dir = os.path.dirname(cv2.__file__)
        haar_dir = os.path.join(cv2_base_dir, 'data')
        
        # Load Haar Cascade for face and eye detection
        self.face_cascade_path = os.path.join(haar_dir, 'haarcascade_frontalface_default.xml')
        self.eye_cascade_path = os.path.join(haar_dir, 'haarcascade_eye.xml')
        
        # Verify files exist
        if not os.path.exists(self.face_cascade_path):
            raise FileNotFoundError(f"Face cascade not found at {self.face_cascade_path}")
        if not os.path.exists(self.eye_cascade_path):
            raise FileNotFoundError(f"Eye cascade not found at {self.eye_cascade_path}")
        
        self.face_cascade = cv2.CascadeClassifier(self.face_cascade_path)
        self.eye_cascade = cv2.CascadeClassifier(self.eye_cascade_path)
        
        # Thresholds
        self.FRAME_VARIATION_THRESHOLD = 2.0  # Minimum variation to detect movement
        self.MIN_BLINK_COUNT = 1  # Minimum blinks required
        
    def decode_base64_image(self, base64_string: str) -> np.ndarray:
        """
        Decode base64 image string to OpenCV format
        
        Args:
            base64_string: Base64 encoded image (with or without data URI prefix)
            
        Returns:
            numpy.ndarray: Image in OpenCV format (BGR)
        """
        try:
            # Remove data URI prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_string)
            
            # Convert to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            
            # Decode to OpenCV image
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Failed to decode image")
            
            return image
        except Exception as e:
            raise ValueError(f"Error decoding base64 image: {str(e)}")
    
    def detect_eyes(self, frame: np.ndarray) -> int:
        """
        Detect number of eyes in a frame
        
        Args:
            frame: OpenCV image (BGR)
            
        Returns:
            int: Number of eyes detected (0, 1, or 2)
        """
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces first
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            return 0
        
        # Get the largest face
        face = max(faces, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = face
        
        # Region of interest (face area)
        roi_gray = gray[y:y+h, x:x+w]
        
        # Detect eyes in face region
        eyes = self.eye_cascade.detectMultiScale(
            roi_gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(20, 20)
        )
        
        return len(eyes)
    
    def detect_blink_pattern(self, frames: List[np.ndarray]) -> Tuple[bool, int]:
        """
        Detect blink pattern in a sequence of frames
        A blink is: Eyes Open -> Eyes Closed/Hidden -> Eyes Open
        
        Args:
            frames: List of OpenCV images
            
        Returns:
            Tuple[bool, int]: (blink_detected, blink_count)
        """
        eye_states = []
        
        # Analyze each frame
        for frame in frames:
            num_eyes = self.detect_eyes(frame)
            # Consider eyes "open" if we detect 2 eyes, "closed" if 0 or 1
            eye_states.append(num_eyes >= 2)
        
        # Count blinks (transitions from open -> closed -> open)
        blink_count = 0
        i = 0
        
        while i < len(eye_states) - 2:
            # Look for pattern: True (open) -> False (closed) -> True (open)
            if eye_states[i] and not eye_states[i+1] and eye_states[i+2]:
                blink_count += 1
                i += 3  # Skip past this blink
            else:
                i += 1
        
        blink_detected = blink_count >= self.MIN_BLINK_COUNT
        
        return blink_detected, blink_count
    
    def calculate_frame_variation(self, frames: List[np.ndarray]) -> float:
        """
        Calculate mean absolute difference between consecutive frames
        Low variation indicates a static image (photo/screen)
        
        Args:
            frames: List of OpenCV images
            
        Returns:
            float: Mean variation across all frame pairs
        """
        if len(frames) < 2:
            return 0.0
        
        variations = []
        
        for i in range(len(frames) - 1):
            # Convert to grayscale
            gray1 = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(frames[i+1], cv2.COLOR_BGR2GRAY)
            
            # Resize to standard size for consistent comparison
            gray1 = cv2.resize(gray1, (320, 240))
            gray2 = cv2.resize(gray2, (320, 240))
            
            # Calculate absolute difference
            diff = cv2.absdiff(gray1, gray2)
            
            # Mean difference
            mean_diff = np.mean(diff)
            variations.append(mean_diff)
        
        # Return average variation
        return np.mean(variations)
    
    def verify_liveness_challenges(self, base64_frames: List[str]) -> Dict:
        """
        Main liveness verification function
        
        Args:
            base64_frames: List of base64 encoded images
            
        Returns:
            Dict with keys:
                - blink: bool (blink detected)
                - blink_count: int (number of blinks)
                - frame_variation: float (movement detected)
                - overall: bool (passed liveness check)
                - message: str (result message)
        """
        try:
            # Validate input
            if not base64_frames or len(base64_frames) < 5:
                return {
                    'blink': False,
                    'blink_count': 0,
                    'frame_variation': 0.0,
                    'overall': False,
                    'message': 'Insufficient frames for liveness detection (minimum 5 required)'
                }
            
            # Decode all frames
            frames = []
            for base64_frame in base64_frames:
                try:
                    frame = self.decode_base64_image(base64_frame)
                    frames.append(frame)
                except Exception as e:
                    print(f"[LIVENESS] Error decoding frame: {e}")
                    continue
            
            if len(frames) < 5:
                return {
                    'blink': False,
                    'blink_count': 0,
                    'frame_variation': 0.0,
                    'overall': False,
                    'message': 'Failed to decode sufficient frames'
                }
            
            # Check 1: Detect blink pattern
            blink_detected, blink_count = self.detect_blink_pattern(frames)
            
            # Check 2: Calculate frame variation (anti-static image)
            frame_variation = self.calculate_frame_variation(frames)
            
            # Overall liveness check
            # Pass if EITHER blink detected OR sufficient frame variation
            variation_pass = frame_variation >= self.FRAME_VARIATION_THRESHOLD
            overall_pass = blink_detected or variation_pass
            
            # Generate message
            if overall_pass:
                if blink_detected:
                    message = f'Liveness verified: {blink_count} blink(s) detected'
                else:
                    message = f'Liveness verified: Natural movement detected (variation: {frame_variation:.2f})'
            else:
                if frame_variation < self.FRAME_VARIATION_THRESHOLD:
                    message = f'Static image detected (variation: {frame_variation:.2f} < {self.FRAME_VARIATION_THRESHOLD})'
                else:
                    message = 'No blink detected and insufficient movement'
            
            return {
                'blink': blink_detected,
                'blink_count': blink_count,
                'frame_variation': round(frame_variation, 2),
                'overall': overall_pass,
                'message': message
            }
            
        except Exception as e:
            print(f"[LIVENESS ERROR] {str(e)}")
            return {
                'blink': False,
                'blink_count': 0,
                'frame_variation': 0.0,
                'overall': False,
                'message': f'Liveness detection error: {str(e)}'
            }


# Singleton instance
_liveness_detector = None

def get_liveness_detector() -> LivenessDetector:
    """Get or create singleton LivenessDetector instance"""
    global _liveness_detector
    if _liveness_detector is None:
        _liveness_detector = LivenessDetector()
    return _liveness_detector
