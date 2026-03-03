# ⚛️ Quantum BB84 Protocol Simulator

![React](https://img.shields.io/badge/frontend-React_19_+_Vite-61DAFB.svg)
![Flask](https://img.shields.io/badge/backend-Flask_Python-000000.svg)
![MediaPipe](https://img.shields.io/badge/vision-MediaPipe_Hands-4285F4.svg)
![WebSocket](https://img.shields.io/badge/realtime-Socket.IO-010101.svg)

An interactive, full-stack simulator of the **BB84 Quantum Key Distribution (QKD)** protocol. This educational tool visualizes how quantum mechanics (Heisenberg's Uncertainty Principle) can be used to generate unconditionally secure encryption keys, protecting data against eavesdropping — with immersive **3D visualizations** and **webcam-based hand gesture control**.

---

## 🚀 Features

### 🔐 Core BB84 Protocol

- **Real-time Quantum Channel** — animated photon bubbles flowing through a transmission tube with different polarization bases (Rectilinear `+` vs Diagonal `×`)
- **Eavesdropper (Eve) Simulation** — toggle an active eavesdropper to see how interception creates detectable errors (QBER)
- **Complete Protocol Lifecycle:**
  1. **Quantum Transmission** — Alice sends random qubits with animated channel visualization
  2. **Basis Sifting** — discard bits where measurement bases mismatched
  3. **Error Correction** — Cascade Protocol to fix bit errors
  4. **Privacy Amplification** — SHA-256 hashing to shrink the key and remove leaked information
- **Hybrid Cryptography** — generates a verified quantum key to power **AES-256-GCM** encryption for secure messaging

### 🌌 3D Photon Visualization

- **Click any photon bubble** in the quantum channel to open a fullscreen immersive 3D space view
- **Interactive 3D sphere** with wireframe, specular highlight, and atmosphere glow
- **Polarization arrow** showing the exact angle with gradient glow trail
- **Navigate all 4 BB84 polarization types** (↑ → ↗ ↖) with left/right arrows or keyboard
- **Animated starfield** background with nebula clouds
- **Glassmorphism HUD** displaying bit value, basis, angle, and symbol
- Drag to rotate, scroll to zoom, auto-rotation in space

### ✋ Hand Gesture Control (Computer Vision)

- **Webcam-based cursor control** powered by MediaPipe Hands (loaded from CDN, zero install)
- **Three distinct gestures:**

  | Gesture                               | Action                                            |
  | ------------------------------------- | ------------------------------------------------- |
  | 🤏 **Pinch** (index + thumb)          | Move cursor · quick release = click · hold = drag |
  | ✌️ **Peace sign** (index + middle up) | Scroll page up/down                               |
  | 🙌 **Two open palms**                 | Rotate 3D model · spread/pinch to zoom            |

- Color-coded cursor ring: 🟢 pinch, 🟣 peace, 🟡 two-palm
- Live webcam preview with gesture badge and FPS counter
- Works fully hands-free — navigate the entire simulation without touching the keyboard

### 📱 Mobile QR Chat

- **Scan QR code** from the desktop to join a secure chat room on mobile
- **Real-time messaging** over Socket.IO with quantum-key-encrypted messages
- **Eve interception visualization** on mobile — see eavesdropper activity in real-time

### 📊 Data Analysis

- Custom SVG-based live graphs showing error rates and sifting efficiency
- Expanded detail views for each protocol stage with step-by-step animations

---

## 🛠️ Tech Stack

| Layer               | Technology                                              |
| ------------------- | ------------------------------------------------------- |
| **Frontend**        | React 19, Vite 7, CSS3 (Custom Dark Theme & Animations) |
| **Backend**         | Python, Flask, Socket.IO                                |
| **Cryptography**    | Web Crypto API (AES-256-GCM), SHA-256                   |
| **3D Rendering**    | Canvas 2D API with custom perspective projection        |
| **Computer Vision** | MediaPipe Hands (CDN, no npm install)                   |
| **Real-time**       | Socket.IO (WebSocket)                                   |
| **QR Code**         | qrcode.react                                            |

---

## 📂 Project Structure

```text
AQH/
├── backend/                  # Python Flask server
│   ├── app.py                # Main API + Socket.IO server
│   └── requirements.txt
├── my-react/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx           # Main application logic
│   │   ├── App.css           # Global styles (dark theme)
│   │   ├── main.jsx          # Router setup
│   │   └── Hack/             # All feature components
│   │       ├── QuantumChannel.jsx         # Photon transmission animation
│   │       ├── QuantumChannelExpanded.jsx  # Detailed channel view
│   │       ├── Photon3DModal.jsx          # 🌌 Fullscreen 3D photon space view
│   │       ├── HandGestureControl.jsx     # ✋ Webcam hand gesture cursor
│   │       ├── AlicePanel.jsx             # Alice's qubit display
│   │       ├── BobPanel.jsx               # Bob's measurement display
│   │       ├── CascadePanel.jsx           # Error correction UI
│   │       ├── CascadeExpanded.jsx        # Detailed Cascade view
│   │       ├── PrivacyAmpPanel.jsx        # Privacy amplification UI
│   │       ├── PrivacyAmpExpanded.jsx     # Detailed PA view
│   │       ├── EncryptionPanel.jsx        # Secure messaging UI
│   │       ├── EncryptionExpanded.jsx     # Detailed encryption view
│   │       ├── EveOverlay.jsx             # Eavesdropper visualization
│   │       ├── EveToggle.jsx              # Eve on/off switch
│   │       ├── MobileChat.jsx             # 📱 Mobile chat interface
│   │       ├── MobileChat.css             # Mobile chat styles
│   │       ├── QRLanding.jsx              # QR code scanner page
│   │       ├── GraphPage.jsx              # SVG-based data graphs
│   │       ├── ExplanationModal.jsx       # Educational tooltips
│   │       └── ...                        # Supporting components
│   └── package.json
└── README.md
```

---

## ⚡ Installation & Setup

### Prerequisites

- **Node.js** & npm
- **Python 3.8+**

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
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
```

> Backend runs on `http://127.0.0.1:5000`

### 2. Frontend Setup

```bash
cd my-react

# Install dependencies
npm install

# Run the development server
npm run dev
```

> Frontend runs on `http://localhost:5173`

---

## 📖 How to Use

1. **Configure** — Use the slider to select the number of qubits (e.g., 50–1000)
2. **Transmit** — Click "Start Transmission" to see Alice send photons to Bob
3. **Inspect Photons** — Click any photon bubble in the channel to open the **3D space view**
   - Navigate between the 4 polarization types with ← → arrows
   - Drag to rotate, scroll to zoom
4. **Sift Keys** — Click "Sift Keys" to reveal which bases matched (green = kept)
5. **Error Check** — Run the "Cascade Protocol". If Eve was listening, the Error Rate (>15%) aborts the process
6. **Encrypt** — If the key is secure, type a message to encrypt it using the quantum key + AES-256
7. **Hand Control** — Click the 🖐️ button (bottom-right) to enable webcam gesture control
   - Pinch to click, peace sign to scroll, two palms to rotate/zoom
8. **Mobile Chat** — Scan the QR code with your phone to join the encrypted chat room

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request for any features or bug fixes.

## 📄 License

This project is open-source and available under the **MIT License**.
