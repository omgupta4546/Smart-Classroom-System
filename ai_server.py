import face_recognition
import numpy as np
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2

# Initialize Flask App
app = Flask(__name__)
CORS(app) # Allow Cross-Origin for JS fetch

# Storage File
DB_FILE = 'known_faces.json'
import json

def load_known_faces():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_known_faces(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f)

# Load data on startup
KNOWN_FACES = load_known_faces()

UPLOAD_FOLDER = 'uploads/faces'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running", "faces_registered": len(KNOWN_FACES)})

@app.route('/register', methods=['POST'])
def register_face():
    try:
        data = request.json
        student_id = data.get('student_id')
        images_b64 = data.get('images') # List of Base64 strings

        if not student_id or not images_b64:
            return jsonify({"error": "Missing data"}), 400

        print(f"Registering faces for Student ID: {student_id}")

        encodings = []

        for idx, img_data in enumerate(images_b64):
            # Decode Base64
            img_bytes = base64.b64decode(img_data.split(',')[1]) 
            img_arr = np.frombuffer(img_bytes, dtype=np.uint8)
            img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)

            # Convert to RGB (face_recognition uses RGB)
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Detect
            face_locations = face_recognition.face_locations(rgb_img)
            face_encs = face_recognition.face_encodings(rgb_img, face_locations)
            
            if len(face_encs) > 0:
                print(f"Face found in image {idx}")
                encodings.append(face_encs[0])
            else:
                print(f"No face found in image {idx}")

        if len(encodings) < 3: # Require at least 3 good samples
            return jsonify({"error": f"Not enough clear faces found. Got {len(encodings)}, need at least 3."}), 400

        # Save Logic (Store average encoding for stability)
        avg_encoding = np.mean(encodings, axis=0)
        
        # Update Memory and File
        KNOWN_FACES[str(student_id)] = avg_encoding.tolist()
        save_known_faces(KNOWN_FACES)

        return jsonify({"status": "success", "faces_processed": len(encodings)})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/recognize', methods=['POST'])
def recognize():
    try:
        data = request.json
        image_b64 = data.get('image')

        # Decode
        img_bytes = base64.b64decode(image_b64.split(',')[1])
        img_arr = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Detect face in frame
        face_locations = face_recognition.face_locations(rgb_img)
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)

        results = []

        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            
            # Compare with known faces
            matched_id = None
            best_score = 0
            
            # Iterate through known faces
            for s_id, k_enc in KNOWN_FACES.items():
                # Compare
                matches = face_recognition.compare_faces([np.array(k_enc)], face_encoding, tolerance=0.45) # Stricter tolerance
                face_distance = face_recognition.face_distance([np.array(k_enc)], face_encoding)[0]
                
                score = (1 - face_distance) * 100 # Rough confidence %
                
                if matches[0] and score > best_score:
                    matched_id = s_id
                    best_score = score
            
            results.append({
                "student_id": matched_id if matched_id else "Unknown",
                "confidence": round(best_score, 2),
                "box": [top, right, bottom, left]
            })

        return jsonify({"matches": results})

    except Exception as e:
         print("Error:", e)
         return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting AI Server on port 5001...")
    app.run(host='0.0.0.0', port=5001)
