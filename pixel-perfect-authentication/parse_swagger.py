import json
import sys

try:
    with open('swagger.json', 'r') as f:
        data = json.load(f)
except Exception as e:
    # If JSON is slightly broken, try to fix it or just read as text
    print(f"Error reading JSON: {e}")
    sys.exit(1)

paths = data.get('paths', {})
for path, methods in paths.items():
    for method, details in methods.items():
        summary = details.get('summary', 'No summary')
        print(f"{method.upper():6} {path:50} | {summary}")
