# ⚛️ Quantum BB84 Simulator

![React](https://img.shields.io/badge/frontend-React_Vite-61DAFB.svg)
![Flask](https://img.shields.io/badge/backend-Flask_Python-000000.svg)

An interactive, full-stack simulator of the **BB84 Quantum Key Distribution (QKD)** protocol. This educational tool visualizes how quantum mechanics (Heisenberg's Uncertainty Principle) can be used to generate unconditionally secure encryption keys, protecting data against eavesdropping.

## 🚀 Features

* **Real-time Quantum Channel:** Visualizes the transmission of qubits (photons) with different polarization bases (Rectilinear `+` vs. Diagonal `×`).
* **Eavesdropper (Eve) Simulation:** Toggle an active eavesdropper to see how interception creates detectable errors (Quantum Bit Error Rate - QBER).
* **Complete Protocol Lifecycle:**
    1.  **Quantum Transmission:** Alice sends random qubits.
    2.  **Basis Sifting:** Alice and Bob discard bits where their measurement bases mismatched.
    3.  **Error Correction:** Implements the **Cascade Protocol** to fix bit errors caused by noise or eavesdropping.
    4.  **Privacy Amplification:** Uses hashing to shrink the key and remove any information leaked to Eve.
* **Hybrid Cryptography:** Generates a verified Quantum Key to power military-grade **AES-256-GCM** encryption for a secure chat interface.
* **Data Analysis:** Live graphs showing error rates and sifting efficiency.

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, CSS3 (Custom Dark Theme & Animations)
* **Backend:** Python, Flask
* **Cryptography:** Web Crypto API (AES-GCM), SHA-256

## 📂 Project Structure

```text
quantum-bb84-simulator/
├── backend/           # Python Flask server (Quantum Logic)
│   ├── app.py         # Main API entry point
│   └── ...
├── my-react/          # React Frontend
│   ├── src/
│   │   ├── Hack/      # Quantum Protocol Components
│   │   ├── App.jsx    # Main Application Logic
│   │   └── ...
│   └── ...
└── README.md

⚡ Installation & Setup
Prerequisites
Node.js & npm

Python 3.8+

1. Backend Setup
Navigate to the backend folder and start the server.

Bash

cd backend

# Create virtual environment (Optional but recommended)
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
The backend usually runs on http://127.0.0.1:5000

2. Frontend Setup
Open a new terminal, navigate to the React folder, and start the UI.

Bash

cd my-react

# Install dependencies
npm install

# Run the development server
npm run dev
The frontend usually runs on http://localhost:5173

📖 How to Use
Configure: Use the slider to select the number of qubits (e.g., 50-1000).

Transmit: Click "Start Transmission" to see Alice send photons to Bob.

Sift Keys: Click "Sift Keys" to reveal which bases matched. Green bits are kept.

Error Check: Run the "Cascade Protocol". If Eve was listening, the Error Rate (>15%) will abort the process.

Encrypt: If the key is secure, type a message in the Secure Messaging panel to encrypt it using the generated Quantum Key + AES-256.

🤝 Contributing
Contributions are welcome! Please fork the repository and create a pull request for any features or bug fixes.

📄 License
This project is open-source and available under the MIT License.
