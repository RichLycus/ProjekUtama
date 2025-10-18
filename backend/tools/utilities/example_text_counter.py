# CATEGORY: Utilities
# NAME: Text Counter
# DESCRIPTION: Count words, characters, and lines in text
# VERSION: 1.0.0
# AUTHOR: ChimeraAI Team

import re


def run(params):
    """
    Count text statistics
    
    params:
        - text: str - Text to analyze
    """
    try:
        text = params.get('text', '')
        
        # Count statistics
        char_count = len(text)
        char_count_no_spaces = len(text.replace(' ', '').replace('\n', ''))
        word_count = len(re.findall(r'\b\w+\b', text))
        line_count = len(text.split('\n'))
        sentence_count = len(re.findall(r'[.!?]+', text))
        
        return {
            "status": "success",
            "statistics": {
                "characters": char_count,
                "characters_no_spaces": char_count_no_spaces,
                "words": word_count,
                "lines": line_count,
                "sentences": sentence_count
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


if __name__ == "__main__":
    # Test
    test_params = {
        "text": "Hello world! This is a test. How are you?"
    }
    result = run(test_params)
    print(result)
