import json

with open('swagger_railway_fmt.json', 'r') as f:
    data = json.load(f)

for path, methods in data.get('paths', {}).items():
    for method, details in methods.items():
        tags = details.get('tags', [])
        # Search by tag or path
        if any(tag in ['Reflection Management', 'Assignment Management', 'Teacher Panel'] for tag in tags) or 'reflection' in path.lower():
            print(f"{path} | {method.upper()} | {details.get('operationId')} | {details.get('summary')}")
