# CATEGORY: Office
# NAME: CSV to JSON Converter
# DESCRIPTION: Convert CSV data to JSON format
# VERSION: 1.0.0
# AUTHOR: ChimeraAI Team

import csv
import json
from io import StringIO


def run(params):
    """
    Convert CSV to JSON
    
    params:
        - csv_data: str - CSV data as string
        - delimiter: str - CSV delimiter (default: ,)
    """
    try:
        csv_data = params.get('csv_data', '')
        delimiter = params.get('delimiter', ',')
        
        # Parse CSV
        csv_file = StringIO(csv_data)
        reader = csv.DictReader(csv_file, delimiter=delimiter)
        
        # Convert to list of dicts
        data = list(reader)
        
        return {
            "status": "success",
            "json_data": data,
            "row_count": len(data)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


if __name__ == "__main__":
    # Test
    test_params = {
        "csv_data": "name,age,city\nJohn,30,NYC\nJane,25,LA",
        "delimiter": ","
    }
    result = run(test_params)
    print(json.dumps(result, indent=2))
