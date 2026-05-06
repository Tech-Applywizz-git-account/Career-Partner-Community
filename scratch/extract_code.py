import json
import os

log_file = r'C:\Users\G.Ganesh\\.gemini\\antigravity\\brain\\f6d6f6b2-2391-40ae-b18d-0a2f20bd80bf\\.system_generated\\logs\\overview.txt'
output_dir = r'c:\Users\G.Ganesh\Downloads\Career_partner_community\Career Partner\scratch'

with open(log_file, 'r', encoding='utf-8') as f:
    i = 0
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE' and 'tool_calls' in data:
                for call in data['tool_calls']:
                    if call['name'] == 'write_to_file' and 'import_users.js' in call['args'].get('TargetFile', ''):
                        content = call['args']['CodeContent']
                        # Content is a JSON string of a string, so we need to decode it
                        # Wait, call['args']['CodeContent'] is already a string but might have escaped newlines
                        
                        # Let's just write the raw content to a temp file and let python handle it
                        out_path = os.path.join(output_dir, f'import_users_v{i}.js')
                        with open(out_path, 'w', encoding='utf-8') as out_f:
                            # Strip leading/trailing quotes and handle escaped chars
                            if content.startswith('"') and content.endswith('"'):
                                content = content[1:-1]
                            content = content.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\')
                            out_f.write(content)
                        i += 1
        except:
            pass
print(f"Extracted {i} versions.")
