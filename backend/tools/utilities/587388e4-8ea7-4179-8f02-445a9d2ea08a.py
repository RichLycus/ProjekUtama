# CATEGORY: DevTools  
# NAME: Advanced Calculator  
# DESCRIPTION: Perform advanced mathematical operations including trigonometry, logarithms, and more  
# VERSION: 1.0.0  
# AUTHOR: ChimeraAI Team  

import math


def run(params):
    """
    Evaluate a mathematical expression with support for advanced functions.
    
    params:
        - expression: str - Mathematical expression to evaluate (e.g., "sin(pi/2) + sqrt(16)")
        - precision: int - Number of decimal places in the result (default: 10)
    
    Supported functions/constants:
        - Basic: +, -, *, /, **, %, //  
        - Functions: sin, cos, tan, asin, acos, atan, sinh, cosh, tanh,  
                     log (natural), log10, log2, sqrt, abs, ceil, floor, round  
        - Constants: pi, e  
    """
    try:
        expression = params.get('expression', '').strip()
        precision = params.get('precision', 10)

        if not expression:
            return {
                "status": "error",
                "message": "Expression cannot be empty"
            }

        # Define safe namespace
        allowed_names = {
            "__builtins__": {},
            "sin": math.sin,
            "cos": math.cos,
            "tan": math.tan,
            "asin": math.asin,
            "acos": math.acos,
            "atan": math.atan,
            "sinh": math.sinh,
            "cosh": math.cosh,
            "tanh": math.tanh,
            "log": math.log,
            "log10": math.log10,
            "log2": math.log2,
            "sqrt": math.sqrt,
            "abs": abs,
            "ceil": math.ceil,
            "floor": math.floor,
            "round": round,
            "pi": math.pi,
            "e": math.e,
        }

        # Evaluate expression safely
        result = eval(expression, {"__builtins__": {}}, allowed_names)

        # Handle float precision
        if isinstance(result, float):
            result = round(result, precision)

        return {
            "status": "success",
            "expression": expression,
            "result": result,
            "precision": precision
        }

    except ZeroDivisionError:
        return {
            "status": "error",
            "message": "Division by zero"
        }
    except SyntaxError:
        return {
            "status": "error",
            "message": "Invalid expression syntax"
        }
    except NameError as e:
        return {
            "status": "error",
            "message": f"Unsupported function or variable: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Calculation error: {str(e)}"
        }


if __name__ == "__main__":
    # Test
    test_params = {
        "expression": "sqrt(16) + sin(pi/2)",
        "precision": 5
    }
    result = run(test_params)
    print(result)
