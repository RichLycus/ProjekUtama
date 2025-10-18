"""
Text Formatter Backend Tool

NAME: Text Formatter
CATEGORY: Office
DESCRIPTION: Format and transform text (uppercase, lowercase, title case, reverse, word count)
VERSION: 1.0.0
AUTHOR: ChimeraAI Team
"""

def run(params):
    """
    Execute text formatting operations
    
    Expected params:
    {
        "text": str,
        "operation": "uppercase" | "lowercase" | "titlecase" | "reverse" | "wordcount"
    }
    """
    text = params.get("text", "")
    operation = params.get("operation", "uppercase")
    
    if not text:
        return {"error": "No text provided"}
    
    if operation == "uppercase":
        result = text.upper()
        operation_name = "Uppercase"
    elif operation == "lowercase":
        result = text.lower()
        operation_name = "Lowercase"
    elif operation == "titlecase":
        result = text.title()
        operation_name = "Title Case"
    elif operation == "reverse":
        result = text[::-1]
        operation_name = "Reversed"
    elif operation == "wordcount":
        words = text.split()
        result = f"Words: {len(words)}, Characters: {len(text)}, Characters (no spaces): {len(text.replace(' ', ''))}"
        operation_name = "Word Count"
    else:
        return {"error": f"Unknown operation: {operation}"}
    
    return {
        "operation": operation_name,
        "original": text,
        "result": result
    }
