# CATEGORY: DevTools
# NAME: JSON Formatter
# DESCRIPTION: Format and beautify JSON data
# VERSION: 1.0.0
# AUTHOR: ChimeraAI Team

import json


def run(params):
    """
    Format JSON data
    
    params:
        - json_string: str - JSON string to format
        - indent: int - Indentation level (default: 2)
    """
    try:
        json_string = params.get('json_string', '{}')
        indent = params.get('indent', 2)
        
        # Parse and format
        data = json.loads(json_string)
        formatted = json.dumps(data, indent=indent, sort_keys=True)
        
        return {
            "status": "success",
            "formatted_json": formatted,
            "line_count": len(formatted.split('\n'))
        }
    except json.JSONDecodeError as e:
        return {
            "status": "error",
            "message": f"Invalid JSON: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


if __name__ == "__main__":
    # Test
    test_params = {
        "json_string": '{"name":"test","value":123}',
        "indent": 2
    }
    result = run(test_params)
    print(result)
