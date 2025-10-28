"""
Text Counter Tool - Backend

NAME: Text Counter
CATEGORY: DevTools
DESCRIPTION: Count words, characters, lines, and sentences in text
VERSION: 1.0.0
AUTHOR: ChimeraAI
"""

def run(params):
    """
    Count statistics from input text
    
    Args:
        params (dict): Must contain 'text' key with string value
        
    Returns:
        dict: Statistics including word count, char count, line count, sentence count
    """
    try:
        # Extract text from params
        text = params.get('text', '')
        
        if not text:
            return {
                "success": False,
                "error": "No text provided"
            }
        
        # Calculate statistics
        word_count = len(text.split())
        char_count = len(text)
        char_no_spaces = len(text.replace(' ', '').replace('\n', '').replace('\t', ''))
        line_count = len(text.split('\n'))
        
        # Count sentences (simple: count periods, exclamation marks, question marks)
        sentence_endings = text.count('.') + text.count('!') + text.count('?')
        sentence_count = max(sentence_endings, 1) if text.strip() else 0
        
        # Calculate average word length
        avg_word_length = round(char_no_spaces / word_count, 2) if word_count > 0 else 0
        
        return {
            "success": True,
            "data": {
                "word_count": word_count,
                "char_count": char_count,
                "char_no_spaces": char_no_spaces,
                "line_count": line_count,
                "sentence_count": sentence_count,
                "avg_word_length": avg_word_length
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
