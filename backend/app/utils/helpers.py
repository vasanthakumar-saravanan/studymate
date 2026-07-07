import json
import re

def extract_json_array(raw: str) -> list:
    if not raw:
        return []

    try:
        parsed = json.loads(raw.strip())
        if isinstance(parsed, list):
            return parsed
    except:
        pass

    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
    except:
        pass

    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
            if isinstance(parsed, list):
                return parsed
        except:
            pass

    return []
