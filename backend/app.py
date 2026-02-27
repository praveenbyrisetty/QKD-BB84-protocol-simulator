from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import secrets
import hashlib
import uuid
import socket

# --- QISKIT IMPORTS ---
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

simulator = AerSimulator()

# --- ROOM MANAGEMENT ---
rooms = {}  # { room_id: { eve: bool, users: [{sid, role}], numBits: 20 } }


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


# --- HELPER FUNCTIONS ---
def run_one_qubit_circuit(alice_bit, alice_basis, bob_basis, eve_present):
    qc = QuantumCircuit(1, 1)
    if alice_bit == 1: qc.x(0)
    if alice_basis == 'x': qc.h(0)
    
    if eve_present:
        if secrets.choice(['+', 'x']) == 'x': qc.h(0)
        qc.measure(0, 0)
        if secrets.choice(['+', 'x']) == 'x': qc.h(0)

    if bob_basis == 'x': qc.h(0)
    qc.measure(0, 0)
    job = simulator.run(qc, shots=1, memory=True)
    return int(job.result().get_memory()[0])


def run_bb84(n, eve):
    """Run the BB84 protocol and return all results."""
    alice_bits = [secrets.randbelow(2) for _ in range(n)]
    alice_bases = [secrets.choice(['+', 'x']) for _ in range(n)]
    bob_bases = [secrets.choice(['+', 'x']) for _ in range(n)]
    bob_results = [run_one_qubit_circuit(alice_bits[i], alice_bases[i], bob_bases[i], eve) for i in range(n)]

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
        h = hashlib.sha256(raw.encode()).hexdigest()
        final_key = [int(b) for b in format(int(h[:16], 16), '064b')]

    return {
        "alice_bits": alice_bits, "alice_bases": alice_bases, "bob_bases": bob_bases,
        "bob_results": bob_results, "alice_key": alice_key, "qber": qber,
        "aborted": aborted, "final_key": final_key
    }


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
    rooms[room_id] = {
        "eve": eve_enabled,
        "numBits": num_bits,
        "users": [],       # Mobile users (Alice, Bob)
        "desktops": [],    # Desktop observers
    }
    local_ip = get_local_ip()
    return jsonify({
        "room_id": room_id,
        "local_ip": local_ip,
    })


@app.route("/room-status/<room_id>", methods=["GET"])
def room_status(room_id):
    if room_id not in rooms:
        return jsonify({"error": "Room not found"}), 404
    room = rooms[room_id]
    users = [{"role": u["role"]} for u in room["users"]]
    return jsonify({
        "room_id": room_id,
        "eve": room["eve"],
        "numBits": room["numBits"],
        "users": users,
        "user_count": len(users),  # Only mobile users count
    })


# --- SOCKET.IO EVENTS ---
@socketio.on("connect")
def handle_connect():
    print(f"[WS] Client connected: {request.sid}")


@socketio.on("disconnect")
def handle_disconnect():
    sid = request.sid
    print(f"[WS] Client disconnected: {sid}")
    for room_id, room in list(rooms.items()):
        # Check desktop observers
        for d in room["desktops"]:
            if d["sid"] == sid:
                room["desktops"].remove(d)
                leave_room(room_id)
                print(f"[WS] Desktop left room {room_id}")
                return
        # Check mobile users
        for user in room["users"]:
            if user["sid"] == sid:
                room["users"].remove(user)
                emit("user_disconnected", {
                    "role": user["role"],
                    "user_count": len(room["users"])
                }, to=room_id)
                leave_room(room_id)
                print(f"[WS] {user['role']} left room {room_id}")
                if len(room["users"]) == 0 and len(room["desktops"]) == 0:
                    del rooms[room_id]
                    print(f"[WS] Room {room_id} deleted (empty)")
                return


@socketio.on("join_room")
def handle_join_room(data):
    room_id = data.get("room_id")
    client_type = data.get("type", "mobile")  # 'desktop' or 'mobile'
    sid = request.sid

    if room_id not in rooms:
        emit("error", {"message": "Room not found"})
        return

    room = rooms[room_id]

    # Desktop joins as observer (doesn't take user slot)
    if client_type == "desktop":
        room["desktops"].append({"sid": sid})
        join_room(room_id)
        emit("room_joined", {
            "role": "desktop",
            "room_id": room_id,
            "eve": room["eve"],
            "user_count": len(room["users"]),
        })
        print(f"[WS] Desktop observer joined room {room_id}")
        return

    # Mobile user
    if len(room["users"]) >= 2:
        emit("error", {"message": "Room is full (max 2 users)"})
        return

    for user in room["users"]:
        if user["sid"] == sid:
            emit("error", {"message": "Already in this room"})
            return

    role = "Alice" if len(room["users"]) == 0 else "Bob"
    room["users"].append({"sid": sid, "role": role})
    join_room(room_id)

    emit("room_joined", {
        "role": role,
        "room_id": room_id,
        "eve": room["eve"],
        "user_count": len(room["users"]),
    })

    emit("user_connected", {
        "role": role,
        "user_count": len(room["users"]),
    }, to=room_id)

    print(f"[WS] {role} joined room {room_id} (users: {len(room['users'])})")


@socketio.on("send_message")
def handle_send_message(data):
    room_id = data.get("room_id")
    message = data.get("message", "")
    sender_sid = request.sid

    if room_id not in rooms:
        emit("error", {"message": "Room not found"})
        return

    room = rooms[room_id]
    
    # Find sender role
    sender_role = None
    for user in room["users"]:
        if user["sid"] == sender_sid:
            sender_role = user["role"]
            break

    if not sender_role:
        emit("error", {"message": "You are not in this room"})
        return

    # Determine receiver role
    receiver_role = "Bob" if sender_role == "Alice" else "Alice"

    print(f"[CHAT] {sender_role} says: '{message}' (eve={room['eve']})")

    # 1. Run BB84 protocol
    bb84_data = run_bb84(room["numBits"], room["eve"])

    # 2. Send BB84 results to desktop for visualization
    emit("bb84_result", {
        "bb84_data": bb84_data,
        "sender": sender_role,
        "message": message,
    }, to=room_id)

    # 3. If BB84 aborted (Eve detected), block the message
    if bb84_data["aborted"]:
        # Generate garbled text that Eve "sees"
        garbled = hashlib.md5(message.encode()).hexdigest()[:16].upper()

        emit("message_blocked", {
            "sender": sender_role,
            "reason": f"Eavesdropping detected! QBER: {bb84_data['qber']*100:.1f}%",
            "eve_saw": garbled,
        }, to=room_id)
        print(f"[CHAT] BLOCKED — Eve detected (QBER: {bb84_data['qber']*100:.1f}%)")
        return

    # 4. Encrypt the message
    cipher_hex, error = encrypt_message(message, bb84_data["final_key"])
    if error:
        emit("message_error", {"error": error}, to=sender_sid)
        return

    # 5. Decrypt the message
    decrypted = decrypt_message(cipher_hex, bb84_data["final_key"])

    # 6. Send encryption details to desktop for visualization
    emit("encryption_result", {
        "cipher_text": cipher_hex,
        "decrypted_message": decrypted,
        "sender": sender_role,
    }, to=room_id)

    # 7. Deliver the message to all users in the room
    emit("message_delivered", {
        "sender": sender_role,
        "message": decrypted,
        "cipher_text": cipher_hex,
        "timestamp": str(uuid.uuid4())[:8],
    }, to=room_id)

    print(f"[CHAT] Message delivered: {sender_role} → {receiver_role}")


if __name__ == "__main__":
    print(f"\n🌐 Local IP: {get_local_ip()}")
    print(f"🚀 Starting server on port 5000...\n")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)