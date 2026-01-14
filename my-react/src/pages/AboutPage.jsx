import React from "react";

export default function AboutPage() {
  return (
    <div className="page">
      <h1>About This Project</h1>
      <p>
        This project demonstrates the <strong>BB84 Quantum Key Distribution</strong> protocol —
        one of the most famous algorithms in quantum cryptography. It allows two
        parties (Alice and Bob) to securely exchange a cryptographic key, while
        detecting the presence of any eavesdropper (Eve).
      </p>

      <p>
        Below, you can explore the <strong>BB84 Quantum Advanced Simulator</strong>, which
        provides a hands-on way to understand the quantum communication process,
        basis selection, bit sifting, and quantum error detection.
      </p>

      <div className="iframe-wrap">
        <iframe
          src="/desc/index.html"
          title="BB84 Quantum Advanced"
          style={{
            width: "100%",
            height: "800px",
            border: "1px solid #ccc",
            borderRadius: "8px"
          }}
        />
      </div>
    </div>
  );
}

