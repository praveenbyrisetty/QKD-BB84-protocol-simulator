import re

# Read the file
with open(r"t:\projects\AQH (2)\AQH\my-react\src\App.jsx", 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the timeout from 3000 to 1000
content = content.replace('}, 3000);', '}, 1000);')

# Find and replace the hoverProps function to add visual effects
old_pattern = r"style: { cursor: 'help' } \r\n  }\);"
new_code = """style: { 
      cursor: 'help',
      transition: 'all 0.3s ease',
      boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)'
    },
    onMouseOver: (e) => {
      e.currentTarget.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.4)';
      e.currentTarget.style.transform = 'scale(1.01)';
    },
    onMouseOut: (e) => {
      e.currentTarget.style.boxShadow = '0 0 0 0 rgba(99, 102, 241, 0)';
      e.currentTarget.style.transform = 'scale(1)';
    }
  });"""

content = re.sub(old_pattern, new_code, content)

# Write back
with open(r"t:\projects\AQH (2)\AQH\my-react\src\App.jsx", 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Hover delay reduced to 1 second")
print("✅ Visual highlight effect added")
