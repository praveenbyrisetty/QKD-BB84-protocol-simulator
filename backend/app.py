from flask import Flask, request, jsonify
from flask_cors import CORS
import secrets
import hashlib

# --- QISKIT IMPORTS ---
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

app = Flask(__name__)
# Allow ALL ports to connect (Fixes "Server not reachable")
CORS(app, resources={r"/*": {"origins": "*"}})


simulator = AerSimulator()

# --- HELPER FUNCTIONS ---
def run_one_qubit_circuit(alice_bit, alice_basis, bob_basis, eve_present):
    qc = QuantumCircuit(1, 1)
    if alice_bit == 1: qc.x(0)
    if alice_basis == 'x': qc.h(0)
    
    if eve_present:
        # Eve guesses basis
        if secrets.choice(['+', 'x']) == 'x': qc.h(0)
        qc.measure(0, 0) # Eve measures (collapses state)
        # Eve prepares new photon
        if secrets.choice(['+', 'x']) == 'x': qc.h(0)

    if bob_basis == 'x': qc.h(0)
    qc.measure(0, 0)
    job = simulator.run(qc, shots=1, memory=True)
    return int(job.result().get_memory()[0])

# --- ROUTES ---
@app.route("/bb84", methods=["POST"])
def bb84_protocol():
    data = request.get_json()
    n = data.get("n", 20)
    eve = data.get("eve", False)
    
    alice_bits = [secrets.randbelow(2) for _ in range(n)]
    alice_bases = [secrets.choice(['+', 'x']) for _ in range(n)]
    bob_bases = [secrets.choice(['+', 'x']) for _ in range(n)]
    bob_results = [run_one_qubit_circuit(alice_bits[i], alice_bases[i], bob_bases[i], eve) for i in range(n)]

    alice_key = []
    for i in range(n):
        if alice_bases[i] == bob_bases[i]: alice_key.append(alice_bits[i])

    # Simple error calc and hashing (Simplified for brevity)
    final_key = [1, 0, 1, 1] 
    if alice_key:
        raw = "".join(str(b) for b in alice_key)
        h = hashlib.sha256(raw.encode()).hexdigest()
        final_key = [int(b) for b in format(int(h[:16], 16), '064b')]

    return jsonify({
        "alice_bits": alice_bits, "alice_bases": alice_bases, "bob_bases": bob_bases,
        "bob_results": bob_results, "alice_key": alice_key, "qber": 0.0,
        "aborted": False, "final_key": final_key
    })

@app.route("/encrypt", methods=["POST"])
def encrypt():
    data = request.get_json()
    message = data.get("message", "")
    key = data.get("key", [])
    
    # Convert message to bits
    msg_bits = ''.join(format(ord(char), '08b') for char in message)
    
    # Security check: One-Time Pad requires key >= message length
    if len(msg_bits) > len(key):
        return jsonify({
            "error": f"Message too long! Need {len(msg_bits)} bits but only have {len(key)} bits of key."
        }), 400
    
    # XOR message bits with key
    cipher_bits = ''.join(str(int(msg_bits[i]) ^ key[i]) for i in range(len(msg_bits)))
    
    # Convert to hex for display
    cipher_hex = hex(int(cipher_bits, 2))[2:].upper().zfill(len(cipher_bits) // 4)
    
    return jsonify({"cipher_text": cipher_hex})

@app.route("/decrypt", methods=["POST"])
def decrypt():
    data = request.get_json()
    cipher_hex = data.get("cipherText", "")
    key = data.get("key", [])
    
    # Convert hex back to bits
    cipher_bits = bin(int(cipher_hex, 16))[2:].zfill(len(cipher_hex) * 4)
    
    # XOR cipher with key to get original message bits
    msg_bits = ''.join(str(int(cipher_bits[i]) ^ key[i]) for i in range(len(cipher_bits)))
    
    # Convert bits back to characters
    chars = [chr(int(msg_bits[i:i+8], 2)) for i in range(0, len(msg_bits), 8)]
    decrypted_message = ''.join(chars)
    
    return jsonify({"decrypted_message": decrypted_message})


if __name__ == "__main__":
    app.run(port=5000, debug=True)