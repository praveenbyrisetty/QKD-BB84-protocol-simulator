from flask import Flask, request, jsonify
from flask_cors import CORS
import secrets
import hashlib
import uuid
import socket
import urllib.request
import json as json_lib
import time
import threading

# --- QISKIT IMPORTS ---
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

simulator = AerSimulator()

# --- ROOM MANAGEMENT ---
# { room_id: { eve, numBits, users: [{user_id, role}], messages: [...], last_activity } }
rooms = {}
rooms_lock = threading.Lock()


def get_local_ip():
    """Get this machine's local IP for QR code URL."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_ngrok_url():
    """Check if ngrok is running and return its public URL."""
    try:
        req = urllib.request.urlopen("http://localhost:4040/api/tunnels", timeout=2)
        data = json_lib.loads(req.read().decode())
        tunnels = data.get("tunnels", [])
        for t in tunnels:
            if t.get("proto") == "https":
                return t["public_url"]
        if tunnels:
            return tunnels[0]["public_url"]
    except Exception:
        pass
    return None


# --- HELPER FUNCTIONS ---
def run_one_qubit_circuit(alice_bit, alice_basis, bob_basis, eve_present):
    qc = QuantumCircuit(1, 1)
    if alice_bit == 1: qc.x(0)
    if alice_basis == 'x': qc.h(0)
    
    eve_basis = None
    eve_result = None
    if eve_present:
        eve_basis = secrets.choice(['+', 'x'])
        if eve_basis == 'x': qc.h(0)
        qc.measure(0, 0)
        eve_job = simulator.run(qc.copy(), shots=1, memory=True)
        eve_result = int(eve_job.result().get_memory()[0])
        # Re-prepare based on Eve's measurement
        qc2 = QuantumCircuit(1, 1)
        if eve_result == 1: qc2.x(0)
        if eve_basis == 'x': qc2.h(0)
        if bob_basis == 'x': qc2.h(0)
        qc2.measure(0, 0)
        job = simulator.run(qc2, shots=1, memory=True)
        return int(job.result().get_memory()[0]), eve_basis, eve_result

    if bob_basis == 'x': qc.h(0)
    qc.measure(0, 0)
    job = simulator.run(qc, shots=1, memory=True)
    return int(job.result().get_memory()[0]), None, None


def run_bb84(n, eve, key_bits_needed=64):
    """Run the BB84 protocol and return all results."""
    alice_bits = [secrets.randbelow(2) for _ in range(n)]
    alice_bases = [secrets.choice(['+', 'x']) for _ in range(n)]
    bob_bases = [secrets.choice(['+', 'x']) for _ in range(n)]

    bob_results = []
    eve_bases = []
    eve_results = []
    for i in range(n):
        bob_bit, e_basis, e_result = run_one_qubit_circuit(alice_bits[i], alice_bases[i], bob_bases[i], eve)
        bob_results.append(bob_bit)
        eve_bases.append(e_basis)
        eve_results.append(e_result)

    alice_key = []
    bob_key = []
    for i in range(n):
        if alice_bases[i] == bob_bases[i]:
            alice_key.append(alice_bits[i])
            bob_key.append(bob_results[i])

    errors = sum(1 for a, b in zip(alice_key, bob_key) if a != b)
    qber = errors / len(alice_key) if alice_key else 0.0
    aborted = qber > 0.11

    final_key = [1, 0, 1, 1]
    if alice_key and not aborted:
        raw = "".join(str(b) for b in alice_key)
        key_hex_needed = (key_bits_needed + 3) // 4
        hash_hex = ""
        counter = 0
        while len(hash_hex) < key_hex_needed:
            h = hashlib.sha256((raw + str(counter)).encode()).hexdigest()
            hash_hex += h
            counter += 1
        hash_hex = hash_hex[:key_hex_needed]
        final_key = [int(b) for b in bin(int(hash_hex, 16))[2:].zfill(key_bits_needed)][:key_bits_needed]

    result = {
        "alice_bits": alice_bits, "alice_bases": alice_bases, "bob_bases": bob_bases,
        "bob_results": bob_results, "alice_key": alice_key, "qber": qber,
        "aborted": aborted, "final_key": final_key
    }
    if eve:
        result["eve_bases"] = eve_bases
        result["eve_results"] = eve_results
    return result


def encrypt_message(message, key):
    """Encrypt a message using One-Time Pad (XOR with key)."""
    msg_bits = ''.join(format(ord(char), '08b') for char in message)
    if len(msg_bits) > len(key):
        return None, f"Message too long! Need {len(msg_bits)} bits but only have {len(key)} bits of key."
    cipher_bits = ''.join(str(int(msg_bits[i]) ^ key[i]) for i in range(len(msg_bits)))
    cipher_hex = hex(int(cipher_bits, 2))[2:].upper().zfill(len(cipher_bits) // 4)
    return cipher_hex, None


def decrypt_message(cipher_hex, key):
    """Decrypt a hex cipher text using One-Time Pad."""
    cipher_bits = bin(int(cipher_hex, 16))[2:].zfill(len(cipher_hex) * 4)
    msg_bits = ''.join(str(int(cipher_bits[i]) ^ key[i]) for i in range(len(cipher_bits)))
    chars = [chr(int(msg_bits[i:i+8], 2)) for i in range(0, len(msg_bits), 8)]
    return ''.join(chars)


def add_room_message(room_id, msg):
    """Thread-safe append to room messages."""
    with rooms_lock:
        if room_id in rooms:
            rooms[room_id]["messages"].append(msg)
            rooms[room_id]["last_activity"] = time.time()


# --- REST ROUTES (Solo Mode) ---
@app.route("/bb84", methods=["POST"])
def bb84_protocol():
    data = request.get_json()
    n = data.get("n", 20)
    eve = data.get("eve", False)
    return jsonify(run_bb84(n, eve))


@app.route("/encrypt", methods=["POST"])
def encrypt():
    data = request.get_json()
    message = data.get("message", "")
    key = data.get("key", [])
    cipher_hex, error = encrypt_message(message, key)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"cipher_text": cipher_hex})


@app.route("/decrypt", methods=["POST"])
def decrypt():
    data = request.get_json()
    cipher_hex = data.get("cipherText", "")
    key = data.get("key", [])
    decrypted = decrypt_message(cipher_hex, key)
    return jsonify({"decrypted_message": decrypted})


# --- REST: Room Management ---
@app.route("/create-room", methods=["POST"])
def create_room():
    data = request.get_json() or {}
    room_id = str(uuid.uuid4())[:8]
    eve_enabled = data.get("eve", False)
    num_bits = data.get("numBits", 50)
    with rooms_lock:
        rooms[room_id] = {
            "eve": eve_enabled,
            "numBits": num_bits,
            "users": [],
            "messages": [],
            "last_activity": time.time(),
        }
    local_ip = get_local_ip()
    ngrok_url = get_ngrok_url()
    result = {
        "room_id": room_id,
        "local_ip": local_ip,
    }
    if ngrok_url:
        result["ngrok_url"] = ngrok_url
        print(f"[ROOM] Using ngrok URL: {ngrok_url}")
    return jsonify(result)


@app.route("/room-status/<room_id>", methods=["GET"])
def room_status(room_id):
    with rooms_lock:
        if room_id not in rooms:
            return jsonify({"error": "Room not found"}), 404
        room = rooms[room_id]
        users = [{"role": u["role"]} for u in room["users"]]
        return jsonify({
            "room_id": room_id,
            "eve": room["eve"],
            "numBits": room["numBits"],
            "users": users,
            "user_count": len(users),
        })


@app.route("/join-room", methods=["POST"])
def join_room():
    """Mobile or desktop client joins a room via REST."""
    data = request.get_json() or {}
    room_id = data.get("room_id")
    user_id = data.get("user_id")
    client_type = data.get("type", "mobile")  # 'desktop' or 'mobile'

    if not room_id or not user_id:
        return jsonify({"error": "room_id and user_id are required"}), 400

    with rooms_lock:
        if room_id not in rooms:
            return jsonify({"error": "Room not found"}), 404

        room = rooms[room_id]

        # Desktop joins as observer (doesn't take user slot)
        if client_type == "desktop":
            # Don't double-add
            for u in room["users"]:
                if u.get("user_id") == user_id:
                    return jsonify({
                        "role": "desktop",
                        "room_id": room_id,
                        "eve": room["eve"],
                        "user_count": len([u for u in room["users"] if u.get("role") != "desktop"]),
                    })
            room["users"].append({"user_id": user_id, "role": "desktop"})
            print(f"[REST] Desktop observer joined room {room_id}")
            return jsonify({
                "role": "desktop",
                "room_id": room_id,
                "eve": room["eve"],
                "user_count": len([u for u in room["users"] if u.get("role") != "desktop"]),
            })

        # Check if user already joined
        for u in room["users"]:
            if u["user_id"] == user_id:
                mobile_count = len([u for u in room["users"] if u.get("role") not in ("desktop",)])
                return jsonify({
                    "role": u["role"],
                    "room_id": room_id,
                    "eve": room["eve"],
                    "user_count": mobile_count,
                })

        # Count mobile users
        mobile_users = [u for u in room["users"] if u.get("role") not in ("desktop",)]
        if len(mobile_users) >= 2:
            return jsonify({"error": "Room is full (max 2 users)"}), 400

        role = "Alice" if len(mobile_users) == 0 else "Bob"
        room["users"].append({"user_id": user_id, "role": role})
        room["last_activity"] = time.time()

        mobile_count = len([u for u in room["users"] if u.get("role") not in ("desktop",)])

        # Add system message
        room["messages"].append({
            "type": "user_connected",
            "role": role,
            "user_count": mobile_count,
            "timestamp": time.time(),
        })

        print(f"[REST] {role} joined room {room_id} (users: {mobile_count})")

        return jsonify({
            "role": role,
            "room_id": room_id,
            "eve": room["eve"],
            "user_count": mobile_count,
        })


@app.route("/leave-room", methods=["POST"])
def leave_room():
    """Client leaves a room."""
    data = request.get_json() or {}
    room_id = data.get("room_id")
    user_id = data.get("user_id")

    if not room_id or not user_id:
        return jsonify({"error": "room_id and user_id are required"}), 400

    with rooms_lock:
        if room_id not in rooms:
            return jsonify({"ok": True})

        room = rooms[room_id]
        role = None
        for u in room["users"]:
            if u["user_id"] == user_id:
                role = u["role"]
                room["users"].remove(u)
                break

        if role and role != "desktop":
            mobile_count = len([u for u in room["users"] if u.get("role") not in ("desktop",)])
            room["messages"].append({
                "type": "user_disconnected",
                "role": role,
                "user_count": mobile_count,
                "timestamp": time.time(),
            })
            print(f"[REST] {role} left room {room_id}")

        # Clean up empty rooms
        if len(room["users"]) == 0:
            del rooms[room_id]
            print(f"[REST] Room {room_id} deleted (empty)")

    return jsonify({"ok": True})


@app.route("/send-message", methods=["POST"])
def send_message():
    """Mobile user sends a message. Runs BB84 synchronously."""
    data = request.get_json() or {}
    room_id = data.get("room_id")
    user_id = data.get("user_id")
    message = data.get("message", "")

    if not room_id or not user_id or not message:
        return jsonify({"error": "room_id, user_id, and message are required"}), 400

    with rooms_lock:
        if room_id not in rooms:
            return jsonify({"error": "Room not found"}), 404
        room = rooms[room_id]
        # Find sender role
        sender_role = None
        for u in room["users"]:
            if u["user_id"] == user_id:
                sender_role = u["role"]
                break
        if not sender_role:
            return jsonify({"error": "You are not in this room"}), 403
        eve = room["eve"]

    # Run BB84 outside lock (CPU-intensive)
    msg_bits_needed = len(message) * 8
    num_qubits = max(msg_bits_needed * 3, 50)
    print(f"[CHAT] {sender_role} says: '{message}' (eve={eve})")
    print(f"[CHAT] Message needs {msg_bits_needed} bits → using {num_qubits} qubits")

    bb84_data = run_bb84(num_qubits, eve, key_bits_needed=msg_bits_needed)

    # If Eve is active, add interception message
    if eve:
        garbled = hashlib.md5(message.encode()).hexdigest()[:len(message)].upper()
        eve_matched = sum(1 for i in range(num_qubits) if bb84_data["eve_bases"][i] == bb84_data["alice_bases"][i])
        eve_msg = {
            "type": "eve_intercepting",
            "sender": sender_role,
            "qubits_intercepted": num_qubits,
            "qubits_correct_basis": eve_matched,
            "garbled_preview": garbled,
            "qber": bb84_data["qber"],
            "timestamp": time.time(),
        }
        add_room_message(room_id, eve_msg)
        print(f"[EVE] Intercepted {num_qubits} qubits, matched basis on {eve_matched}")

    # Add BB84 result for desktop visualization
    bb84_msg = {
        "type": "bb84_result",
        "bb84_data": bb84_data,
        "sender": sender_role,
        "message": message,
        "num_qubits": num_qubits,
        "timestamp": time.time(),
    }
    add_room_message(room_id, bb84_msg)

    # If BB84 aborted (Eve detected), block the message
    if bb84_data["aborted"]:
        garbled = hashlib.md5(message.encode()).hexdigest()[:16].upper()
        blocked_msg = {
            "type": "message_blocked",
            "sender": sender_role,
            "reason": f"Eavesdropping detected! QBER: {bb84_data['qber']*100:.1f}%",
            "eve_saw": garbled,
            "timestamp": time.time(),
        }
        add_room_message(room_id, blocked_msg)
        print(f"[CHAT] BLOCKED — Eve detected (QBER: {bb84_data['qber']*100:.1f}%)")
        return jsonify({"status": "blocked", "reason": blocked_msg["reason"]})

    # Encrypt + Decrypt
    cipher_hex, error = encrypt_message(message, bb84_data["final_key"])
    if error:
        return jsonify({"error": error}), 400

    decrypted = decrypt_message(cipher_hex, bb84_data["final_key"])

    # Add encryption result for desktop
    enc_msg = {
        "type": "encryption_result",
        "cipher_text": cipher_hex,
        "decrypted_message": decrypted,
        "sender": sender_role,
        "timestamp": time.time(),
    }
    add_room_message(room_id, enc_msg)

    # Add delivered message
    delivered_msg = {
        "type": "message_delivered",
        "sender": sender_role,
        "message": decrypted,
        "cipher_text": cipher_hex,
        "timestamp": time.time(),
    }
    add_room_message(room_id, delivered_msg)

    receiver_role = "Bob" if sender_role == "Alice" else "Alice"
    print(f"[CHAT] Message delivered: {sender_role} → {receiver_role}")

    return jsonify({"status": "delivered", "message": delivered_msg})


@app.route("/room-messages/<room_id>", methods=["GET"])
def room_messages(room_id):
    """Poll for new messages since a given index."""
    since = request.args.get("since", 0, type=int)

    with rooms_lock:
        if room_id not in rooms:
            return jsonify({"error": "Room not found"}), 404
        room = rooms[room_id]
        messages = room["messages"][since:]
        mobile_count = len([u for u in room["users"] if u.get("role") not in ("desktop",)])
        return jsonify({
            "messages": messages,
            "total": len(room["messages"]),
            "user_count": mobile_count,
        })


@app.route("/heartbeat", methods=["POST"])
def heartbeat():
    """Keep-alive for clients — updates last_activity."""
    data = request.get_json() or {}
    room_id = data.get("room_id")
    if room_id and room_id in rooms:
        with rooms_lock:
            if room_id in rooms:
                rooms[room_id]["last_activity"] = time.time()
    return jsonify({"ok": True})


if __name__ == "__main__":
    print(f"\n🌐 Local IP: {get_local_ip()}")
    print(f"🚀 Starting server on port 5000 (pure REST, no WebSockets)...\n")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)