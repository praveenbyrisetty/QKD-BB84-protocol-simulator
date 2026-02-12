# BB84 Quantum Key Distribution - Backend

This backend implements the BB84 quantum key distribution protocol with proper simulation of quantum mechanics.

## Setup

### 1. Install Dependencies

```bash
pip install flask flask-cors qiskit qiskit-aer google-generativeai
```

### 2. Configure API Key (Optional - for ChatBot)

**Recommended (Secure)**: Set environment variable

```bash
# Windows PowerShell
$env:GOOGLE_API_KEY="your-api-key-here"

# Linux/Mac
export GOOGLE_API_KEY="your-api-key-here"
```

**Development Only**: The code has a fallback hardcoded key for testing

### 3. Run the Server

```bash
python app.py
```

Server will start on `http://127.0.0.1:5000`

## BB84 Protocol Implementation

### Correct Implementation Details

#### 1. Quantum Transmission

- **Alice**: Prepares qubits in random bases (rectilinear `+` or diagonal `x`)
- **Encoding**:
  - Rectilinear basis: `|0⟩` (bit 0) or `|1⟩` (bit 1)
  - Diagonal basis: `|+⟩` (bit 0) or `|−⟩` (bit 1)

#### 2. Eve's Eavesdropping (When Enabled)

**CORRECT LOGIC**:

1. Eve intercepts the qubit from Alice
2. Eve measures in a **random basis** (50% chance of matching Alice's)
3. Eve prepares a **NEW qubit** based on her measurement result
4. Eve sends this new qubit to Bob

**Result**: When Eve's basis ≠ Alice's basis, she gets a random result and introduces errors

- Expected QBER with Eve: ~25%
- Expected QBER without Eve: ~0-2%

#### 3. Basis Sifting

- Alice and Bob publicly compare bases
- Keep only bits where bases matched (~50% of original)
- This is the "sifted key"

#### 4. QBER Calculation & Security Check

- Randomly sample **25%** of the sifted key
- Alice and Bob publicly compare these bits
- Calculate error rate: `QBER = (errors / sample_size) × 100`
- **Abort if QBER > 11%** (indicates eavesdropping)

#### 5. Privacy Amplification

- Remove the tested bits (already public)
- Hash remaining key with SHA-256
- Extract 64-bit final secret key

## API Endpoints

### POST `/bb84`

Run BB84 protocol

**Request**:

```json
{
  "n": 100, // Number of qubits to transmit
  "eve": false // Enable eavesdropping
}
```

**Response**:

```json
{
  "alice_bits": [...],      // Alice's original bits
  "alice_bases": [...],     // Alice's bases
  "bob_bases": [...],       // Bob's measurement bases
  "bob_results": [...],     // Bob's measurement results
  "alice_key": [...],       // Sifted key (Alice's version)
  "bob_key": [...],         // Sifted key (Bob's version)
  "qber": 0.5,              // Quantum Bit Error Rate (%)
  "errors": 2,              // Number of errors found
  "sample_size": 10,        // Size of QBER test sample
  "aborted": false,         // Whether protocol aborted
  "final_key": [...]        // Final secret key (if not aborted)
}
```

### POST `/chat`

AI chatbot for BB84 questions

**Request**:

```json
{
  "message": "What is quantum key distribution?"
}
```

**Response**:

```json
{
  "reply": "QKD uses quantum mechanics to securely distribute encryption keys..."
}
```

## Educational Notes

### Why 11% Threshold?

- With Eve present: QBER ≈ 25%
- Without Eve: QBER ≈ 0-2%
- Threshold of 11% provides security margin
- Real implementations may use different thresholds based on noise levels

### Quantum Circuit Details

The implementation uses Qiskit to simulate actual quantum circuits:

- Hadamard gate (H) rotates between rectilinear and diagonal bases
- X gate (NOT) flips qubit from |0⟩ to |1⟩
- Measurement collapses superposition to classical bit

### Limitations

- This is a simulation for educational purposes
- Real BB84 uses photon polarization states
- Real systems include error correction (Cascade algorithm) - partially implemented in UI
- Real systems use authenticated classical channel - not implemented
