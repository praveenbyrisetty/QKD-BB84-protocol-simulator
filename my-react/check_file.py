import sys

# Read the file
with open(r"t:\projects\AQH (2)\AQH\my-react\src\App.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Print lines 124-132 (0-indexed: 123-131)
print("Lines 124-132:")
for i in range(123, 132):
    if i < len(lines):
        print(f"{i+1}: {repr(lines[i])}")
