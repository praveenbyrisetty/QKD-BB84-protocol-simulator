export const EXPLANATIONS = {
  "channel": {
    title: "Quantum Channel",
    text: "This simulates the fiber optic cable. Photons travel from Alice to Bob. If Eve intercepts them here, the color changes, representing a change in the quantum state."
  },
  "alice": {
    title: "Alice (The Sender)",
    text: "Alice generates random bits and chooses random bases (+ or x) to encode them. She sends these photons through the Quantum Channel to Bob."
  },
  "bob": {
    title: "Bob (The Receiver)",
    text: "Bob blindly chooses random bases to measure the incoming photons. He doesn't know Alice's bases yet. He only keeps the data where his basis happens to match Alice's."
  },
  "cascade": {
    title: "Cascade Protocol (Error Correction)",
    text: "Alice and Bob compare parity of small blocks of their keys. If a block has an error (odd parity), they perform a binary search to find and fix the bit flipped by Eve."
  },
  "privacy": {
    title: "Privacy Amplification",
    text: "Even with 0 errors, Eve might know a few bits. We run the key through a Hash Function (SHA-256). This shrinks the key but ensures that any partial knowledge Eve had is completely scrambled."
  },
  "encrypt": {
    title: "Secure Messaging (OTP)",
    text: "Using the final Quantum Key, we perform an XOR operation on your message. Because the key is truly random and used only once, this encryption is mathematically impossible to break."
  },
  "config": {
    title: "Configuration",
    text: "Adjust the number of Qubits (Photons) sent. More qubits mean a longer, more secure key, but the simulation will take longer to run."
  }
};