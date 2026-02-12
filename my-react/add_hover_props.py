import re

# Read the file
with open(r"t:\projects\AQH (2)\AQH\my-react\src\App.jsx", 'r', encoding='utf-8') as f:
    content = f.read()

# Replace for Cascade Panel
content = content.replace(
    "                  <div style={{height:'100%'}}>",
    "                  <div style={{height:'100%'}} {...hoverProps('Cascade Protocol', 'Error correction algorithm that compares subsets of bits between Alice and Bob to detect and fix errors.')}>",
    1  # Only replace first occurrence
)

# Replace for QBER Analysis
content = content.replace(
    "                  <div style={{background:'rgba(15, 23, 42, 0.5)', borderRadius:'12px', border:'1px solid #334155', padding:'20px'}}>",
    "                  <div style={{background:'rgba(15, 23, 42, 0.5)', borderRadius:'12px', border:'1px solid #334155', padding:'20px'}} {...hoverProps('QBER Analysis', 'Quantum Bit Error Rate shows the percentage of mismatched bits. High QBER indicates potential eavesdropping.')}>",
    1
)

# Write back
with open(r"t:\projects\AQH (2)\AQH\my-react\src\App.jsx", 'w', encoding='utf-8') as f:
    f.write(content)

print("Hover props added successfully!")
