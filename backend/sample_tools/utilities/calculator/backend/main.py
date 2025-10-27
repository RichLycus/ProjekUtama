"""
Simple Calculator Backend Tool

NAME: Simple Calculator
CATEGORY: Utilities
DESCRIPTION: Perform basic arithmetic operations (add, subtract, multiply, divide)
VERSION: 1.0.0
AUTHOR: ChimeraAI Team
"""

def run(params):
    """
    Execute calculator operations
    
    Expected params:
    {
        "operation": "add" | "subtract" | "multiply" | "divide",
        "num1": float,
        "num2": float
    }
    """
    operation = params.get("operation", "add")
    num1 = float(params.get("num1", 0))
    num2 = float(params.get("num2", 0))
    
    if operation == "add":
        result = num1 + num2
    elif operation == "subtract":
        result = num1 - num2
    elif operation == "multiply":
        result = num1 * num2
    elif operation == "divide":
        if num2 == 0:
            return {"error": "Cannot divide by zero"}
        result = num1 / num2
    else:
        return {"error": f"Unknown operation: {operation}"}
    
    return {
        "operation": operation,
        "num1": num1,
        "num2": num2,
        "result": result
    }
