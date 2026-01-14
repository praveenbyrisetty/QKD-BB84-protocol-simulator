const { useState, useEffect, useRef, useMemo } = React;

// Quantum data from the provided JSON
const quantumData = {
  protocol_info: {
    name: "BB84 Protocol",
    inventors: "Charles Bennett and Gilles Brassard",
    year: "1984",
    description: "The first quantum key distribution protocol that enables secure communication using quantum mechanical principles through photon polarization encoding"
  },
  quantum_channel: {
    definition: "A communication channel that can transmit quantum information using individual photons while preserving quantum properties",
    characteristics: {
      photon_transmission: "Individual photons carry quantum bits (qubits) encoded in polarization states",
      quantum_properties: "Preserves superposition, entanglement, and maintains quantum coherence during transmission",
      physical_implementation: ["Fiber optic cables", "Free space transmission", "Integrated photonic circuits"],
      transmission_range: "Up to 100+ km in standard fiber optics before losses dominate",
      security_basis: "Security derived from fundamental laws of quantum mechanics, not mathematical complexity"
    },
    vs_classical_channel: {
      classical: "Transmits only classical bits (0s and 1s) through electrical or optical pulses",
      quantum: "Transmits quantum states including superpositions like |0⟩+|1⟩ while preserving coherence",
      information_capacity: "Quantum channels can carry both classical and quantum information simultaneously",
      eavesdropping_detection: "Classical channels cannot detect eavesdropping, quantum channels inherently reveal tampering"
    }
  },
  quantum_gates: {
    definition: "Mathematical operations that manipulate quantum states in controlled ways",
    bb84_gates: {
      hadamard_gate: {
        symbol: "H",
        function: "Creates superposition states and switches between computational bases",
        transformation: "|0⟩ → |+⟩ = (|0⟩+|1⟩)/√2, |1⟩ → |-⟩ = (|0⟩-|1⟩)/√2",
        role_in_bb84: "Switches between rectilinear (Z) and diagonal (X) bases for encoding/measuring"
      },
      pauli_x_gate: {
        symbol: "X",
        function: "Bit-flip operation, rotates qubit state",
        transformation: "|0⟩ → |1⟩, |1⟩ → |0⟩",
        role_in_bb84: "Used for state preparation and bit encoding"
      },
      identity_gate: {
        symbol: "I",
        function: "No operation, preserves quantum state",
        role_in_bb84: "Used when no basis transformation is needed"
      }
    }
  },
  rsa_vs_qkd_comparison: {
    security_foundation: {
      rsa: "Mathematical complexity - difficulty of factoring large integers",
      qkd: "Laws of physics - quantum mechanical principles like no-cloning theorem"
    },
    key_distribution: {
      rsa: "Uses public/private key pairs, mathematical algorithms for key exchange",
      qkd: "Direct quantum transmission of shared secret keys using photon polarization"
    },
    eavesdropping_detection: {
      rsa: "Cannot detect passive eavesdropping on key exchange",
      qkd: "Automatically detects any eavesdropping through quantum measurement disturbance"
    },
    computational_security: {
      rsa: "Vulnerable to quantum computers using Shor's algorithm",
      qkd: "Quantum-safe - security increases with quantum computing advances"
    },
    implementation: {
      rsa: "Software-based, works on standard computer networks",
      qkd: "Requires specialized quantum hardware - photon sources, detectors, quantum channels"
    }
  },
  protocol_steps: [
    {
      step: 1,
      title: "Random Bit Generation",
      description: "Alice generates random bit stream and basis choices using quantum random number generators",
      technical_details: [
        "Alice creates random bit string using QRNG (Quantum Random Number Generator)",
        "Alice creates random basis string (0=rectilinear, 1=diagonal)",
        "Each bit has 50% probability of being 0 or 1",
        "Each basis choice is independent and random"
      ]
    },
    {
      step: 2,
      title: "Quantum State Preparation & Encoding",
      description: "Alice encodes bits into photon polarization states using quantum gates",
      technical_details: [
        "Photons prepared in specific polarization states using optical elements",
        "Hadamard gates used to switch between rectilinear and diagonal bases",
        "Pauli-X gates applied for bit-flip operations when needed",
        "Single photons generated using parametric down-conversion or laser diodes"
      ]
    },
    {
      step: 3,
      title: "Quantum Channel Transmission",
      description: "Encoded photons transmitted through quantum channel while preserving quantum properties",
      technical_details: [
        "Individual photons travel through fiber optic or free-space quantum channels",
        "Channel maintains quantum coherence and polarization states",
        "Transmission losses and noise affect but don't compromise security",
        "Channel may be insecure from classical perspective but quantum properties provide protection"
      ]
    },
    {
      step: 4,
      title: "Random Quantum Measurement",
      description: "Bob randomly selects measurement basis and performs quantum measurement on received photons",
      technical_details: [
        "Bob independently generates random basis choices",
        "Quantum measurement performed using polarizing beam splitters and detectors",
        "Measurement basis determines which quantum gate operations are applied",
        "Correct result obtained only when measurement basis matches encoding basis (50% probability)"
      ]
    },
    {
      step: 5,
      title: "Basis Reconciliation",
      description: "Alice and Bob compare basis choices over authenticated classical channel",
      technical_details: [
        "Classical channel communication reveals basis choices but not bit values",
        "Authentication prevents man-in-the-middle attacks on classical communication",
        "Approximately 50% of transmitted bits discarded due to basis mismatch",
        "Remaining bits form the 'sifted key' where bases matched"
      ]
    },
    {
      step: 6,
      title: "Error Detection & Eavesdropping Check",
      description: "Statistical test performed on subset of sifted key to detect eavesdropping",
      technical_details: [
        "Random sample of matching bits compared publicly",
        "Error rate calculated from bit disagreements",
        "Error threshold typically set at 11% (BB84 theoretical limit ~25%)",
        "High error rate indicates eavesdropping attempt - protocol aborted"
      ]
    },
    {
      step: 7,
      title: "Error Correction & Privacy Amplification",
      description: "Final key processing to correct errors and ensure security against partial information leakage",
      technical_details: [
        "Classical error correction algorithms applied to remaining key bits",
        "Privacy amplification reduces key length to eliminate eavesdropper information",
        "Hash functions or other compression techniques used",
        "Final secure key ready for use with one-time pad encryption"
      ]
    }
  ]
};

// Main Application Component
function QuantumApp() {
  const [selectedBasis, setSelectedBasis] = useState('rectilinear');
  const [activeGate, setActiveGate] = useState('hadamard');
  const [visibleSteps, setVisibleSteps] = useState(new Set());
  
  // Intersection Observer for animations
  const stepRefs = useRef([]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const stepIndex = parseInt(entry.target.dataset.step);
            setVisibleSteps(prev => new Set([...prev, stepIndex]));
          }
        });
      },
      { threshold: 0.3 }
    );

    stepRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Hero Section Component
  const HeroSection = () => (
    <section className="hero">
      <div className="hero-content">
        <h1 className="main-title">BB84 Quantum Cryptography</h1>
        <p className="hero-subtitle">Quantum Channels, Gates & Unbreakable Security</p>
        <p className="hero-description">
          Explore the revolutionary world of quantum key distribution, where individual photons carry encrypted information 
          through quantum channels, protected by the fundamental laws of physics rather than mathematical complexity.
        </p>
      </div>
    </section>
  );

  // Quantum Channel Deep Dive Component
  const QuantumChannelSection = () => (
    <section className="quantum-channel">
      <h2 className="section-title">Quantum vs Classical Channels</h2>
      <div className="channel-comparison">
        <div className="channel-type classical">
          <h3 className="channel-title">Classical Channel</h3>
          <div className="photon-animation">
            <div className="photon"></div>
          </div>
          <ul style={{listStyle: 'none', padding: 0, color: '#E0E0E0'}}>
            <li>• Transmits only classical bits (0s and 1s)</li>
            <li>• Uses electrical or optical pulses</li>
            <li>• Cannot detect eavesdropping</li>
            <li>• High data transmission rates</li>
            <li>• Security relies on mathematical complexity</li>
          </ul>
        </div>
        <div className="channel-type quantum">
          <h3 className="channel-title">Quantum Channel</h3>
          <div className="photon-animation">
            <div className="photon">
              <div className="polarization-indicator"></div>
            </div>
          </div>
          <ul style={{listStyle: 'none', padding: 0, color: '#E0E0E0'}}>
            <li>• Transmits quantum states and superpositions</li>
            <li>• Uses individual polarized photons</li>
            <li>• Automatically detects eavesdropping</li>
            <li>• Preserves quantum coherence</li>
            <li>• Security based on physics laws</li>
          </ul>
        </div>
      </div>
      
      <div style={{textAlign: 'center', marginTop: '2rem'}}>
        <h3 className="text-light" style={{marginBottom: '1rem'}}>Quantum Channel Properties</h3>
        <div className="physics-demo">
          <div className="wave-function">
            <div className="wave"></div>
          </div>
          <p className="text-secondary" style={{maxWidth: '600px', margin: '0 auto'}}>
            Quantum channels preserve photon polarization states during transmission, maintaining quantum 
            coherence essential for secure key distribution. Any measurement or interference by an eavesdropper 
            disturbs these delicate quantum states, making intrusion detectable.
          </p>
        </div>
      </div>
    </section>
  );

  // Quantum Gates Explorer Component
  const QuantumGatesSection = () => (
    <section className="quantum-gates">
      <h2 className="section-title">Quantum Gates in BB84</h2>
      <div className="gates-grid">
        <div className="gate-card">
          <div className="gate-symbol">H</div>
          <h3 className="gate-title">Hadamard Gate</h3>
          <p className="gate-description">
            Creates superposition states and switches between computational bases
          </p>
          <div className="transformation">
            |0⟩ → |+⟩ = (|0⟩+|1⟩)/√2<br/>
            |1⟩ → |-⟩ = (|0⟩-|1⟩)/√2
          </div>
          <p className="text-muted" style={{marginTop: '1rem', fontSize: '0.9rem'}}>
            Role: Switches between rectilinear (Z) and diagonal (X) bases for encoding/measuring
          </p>
        </div>
        
        <div className="gate-card">
          <div className="gate-symbol">X</div>
          <h3 className="gate-title">Pauli-X Gate</h3>
          <p className="gate-description">
            Bit-flip operation that rotates qubit state
          </p>
          <div className="transformation">
            |0⟩ → |1⟩<br/>
            |1⟩ → |0⟩
          </div>
          <p className="text-muted" style={{marginTop: '1rem', fontSize: '0.9rem'}}>
            Role: Used for state preparation and bit encoding operations
          </p>
        </div>
        
        <div className="gate-card">
          <div className="gate-symbol">I</div>
          <h3 className="gate-title">Identity Gate</h3>
          <p className="gate-description">
            No operation - preserves the current quantum state
          </p>
          <div className="transformation">
            |0⟩ → |0⟩<br/>
            |1⟩ → |1⟩
          </div>
          <p className="text-muted" style={{marginTop: '1rem', fontSize: '0.9rem'}}>
            Role: Used when no basis transformation is needed
          </p>
        </div>
      </div>
      
      <div style={{textAlign: 'center', marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
        <h3 className="text-light">Physical Implementation</h3>
        <p className="text-secondary">
          Quantum gates in BB84 are implemented using optical elements: wave plates for polarization rotation, 
          polarizing beam splitters for measurement, and phase modulators for state manipulation.
        </p>
      </div>
    </section>
  );

  // Photon Polarization Laboratory Component
  const PolarizationLabSection = () => {
    const polarizationStates = {
      rectilinear: [
        { symbol: '|0⟩', angle: '0', description: 'Horizontal (0°)', bit: '0', class: 'angle-0' },
        { symbol: '|1⟩', angle: '90', description: 'Vertical (90°)', bit: '1', class: 'angle-90' }
      ],
      diagonal: [
        { symbol: '|+⟩', angle: '45', description: 'Diagonal (45°)', bit: '0', class: 'angle-45' },
        { symbol: '|-⟩', angle: '135', description: 'Anti-diagonal (135°)', bit: '1', class: 'angle-135' }
      ]
    };

    return (
      <section className="polarization-lab">
        <h2 className="section-title">Photon Polarization Laboratory</h2>
        <div className="lab-controls">
          <button 
            className={`basis-btn ${selectedBasis === 'rectilinear' ? 'active' : ''}`}
            onClick={() => setSelectedBasis('rectilinear')}
          >
            Rectilinear Basis (Z)
          </button>
          <button 
            className={`basis-btn ${selectedBasis === 'diagonal' ? 'active' : ''}`}
            onClick={() => setSelectedBasis('diagonal')}
          >
            Diagonal Basis (X)
          </button>
        </div>
        
        <div className="polarization-display">
          {polarizationStates[selectedBasis].map((state, index) => (
            <div key={index} className="polarization-card">
              <div className="quantum-notation">{state.symbol}</div>
              <div className="polarization-visual">
                <div className={`polarization-line ${state.class}`}></div>
              </div>
              <div className="state-description">
                <strong>{state.description}</strong><br/>
                Bit value: {state.bit}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{textAlign: 'center', marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,255,255,0.05)', borderRadius: '12px'}}>
          <h3 className="highlight">Encoding Process</h3>
          <p className="text-secondary" style={{maxWidth: '700px', margin: '1rem auto 0'}}>
            Alice encodes each bit by preparing photons in specific polarization states. The chosen basis (rectilinear or diagonal) 
            determines the polarization angles, while the bit value (0 or 1) selects the specific state within that basis.
          </p>
        </div>
      </section>
    );
  };

  // RSA vs QKD Battle Arena Component
  const BattleArenaSection = () => (
    <section className="battle-arena">
      <h2 className="section-title">RSA vs QKD: Security Showdown</h2>
      <div className="battle-comparison">
        <div className="fighter rsa">
          <div className="fighter-icon">🔢</div>
          <h3 className="fighter-title">RSA Encryption</h3>
          <ul className="fighter-stats">
            <li><span className="stat-label">Security Foundation:</span> Mathematical complexity</li>
            <li><span className="stat-label">Key Distribution:</span> Public/private key pairs</li>
            <li><span className="stat-label">Eavesdropping Detection:</span> None</li>
            <li><span className="stat-label">Quantum Computer Vulnerability:</span> High (Shor's Algorithm)</li>
            <li><span className="stat-label">Implementation:</span> Software-based</li>
            <li><span className="stat-label">Distance Limitations:</span> None</li>
            <li><span className="stat-label">Data Rates:</span> Very High</li>
          </ul>
        </div>
        
        <div className="fighter qkd">
          <div className="fighter-icon">⚛️</div>
          <h3 className="fighter-title">Quantum Key Distribution</h3>
          <ul className="fighter-stats">
            <li><span className="stat-label">Security Foundation:</span> Laws of physics</li>
            <li><span className="stat-label">Key Distribution:</span> Quantum channel transmission</li>
            <li><span className="stat-label">Eavesdropping Detection:</span> Automatic</li>
            <li><span className="stat-label">Quantum Computer Vulnerability:</span> None</li>
            <li><span className="stat-label">Implementation:</span> Specialized hardware</li>
            <li><span className="stat-label">Distance Limitations:</span> ~100-500km</li>
            <li><span className="stat-label">Data Rates:</span> Lower (key generation)</li>
          </ul>
        </div>
      </div>
      
      <div style={{textAlign: 'center', marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,255,0,0.05)', borderRadius: '12px'}}>
        <h3 className="success">The Quantum Advantage</h3>
        <p className="text-light" style={{maxWidth: '800px', margin: '1rem auto 0', fontSize: '1.1rem'}}>
          While RSA relies on mathematical problems that quantum computers can solve, QKD's security is guaranteed by 
          quantum mechanics itself. Any attempt to intercept quantum-encoded information inevitably disturbs the quantum 
          states, making eavesdropping immediately detectable.
        </p>
      </div>
    </section>
  );

  // Enhanced Protocol Walkthrough Component
  const ProtocolWalkthroughSection = () => (
    <section className="protocol-walkthrough">
      <h2 className="section-title">Enhanced BB84 Protocol</h2>
      <div className="protocol-steps">
        {quantumData.protocol_steps.map((step, index) => (
          <div 
            key={step.step}
            ref={el => stepRefs.current[index] = el}
            data-step={index}
            className={`protocol-step ${visibleSteps.has(index) ? 'visible' : ''}`}
          >
            <div className="step-number">{step.step}</div>
            <div className="step-content">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <ul className="step-details">
                {step.technical_details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // Security Analysis Dashboard Component
  const SecurityDashboardSection = () => (
    <section className="security-dashboard">
      <h2 className="section-title">Security Analysis Dashboard</h2>
      <div className="security-metrics">
        <div className="metric-card">
          <div className="metric-value">∞</div>
          <div className="metric-label">Information-Theoretic Security</div>
          <p className="text-muted" style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>
            QKD provides unconditional security independent of computational power
          </p>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">25%</div>
          <div className="metric-label">Maximum Tolerable Error Rate</div>
          <p className="text-muted" style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>
            BB84 theoretical limit for detecting eavesdropping attempts
          </p>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">50%</div>
          <div className="metric-label">Basis Matching Efficiency</div>
          <p className="text-muted" style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>
            Expected percentage of photons with matching encoding/measurement bases
          </p>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">100%</div>
          <div className="metric-label">Future-Proof Security</div>
          <p className="text-muted" style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>
            Quantum-safe against all computational advances
          </p>
        </div>
      </div>
      
      <div style={{textAlign: 'center', marginTop: '3rem'}}>
        <h3 className="text-light" style={{marginBottom: '1rem'}}>Quantum Advantages</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', maxWidth: '1000px', margin: '0 auto'}}>
          <div style={{background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,255,255,0.2)'}}>
            <h4 className="highlight">No-Cloning Theorem</h4>
            <p className="text-secondary" style={{fontSize: '0.9rem'}}>
              Quantum information cannot be copied perfectly, preventing replay attacks
            </p>
          </div>
          <div style={{background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,255,0,0.2)'}}>
            <h4 className="success">Measurement Disturbance</h4>
            <p className="text-secondary" style={{fontSize: '0.9rem'}}>
              Any measurement collapses quantum states, revealing eavesdropping
            </p>
          </div>
          <div style={{background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.2)'}}>
            <h4 className="warning">Quantum Uncertainty</h4>
            <p className="text-secondary" style={{fontSize: '0.9rem'}}>
              Incompatible measurements cannot be performed simultaneously
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  // Main render
  return (
    <div className="quantum-app">
      <HeroSection />
      <QuantumChannelSection />
      <QuantumGatesSection />
      <PolarizationLabSection />
      <BattleArenaSection />
      <ProtocolWalkthroughSection />
      <SecurityDashboardSection />
    </div>
  );
}

// Render the application
ReactDOM.render(<QuantumApp />, document.getElementById('root'));