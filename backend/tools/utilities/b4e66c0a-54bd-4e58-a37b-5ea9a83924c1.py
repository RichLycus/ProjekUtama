"""
Test Calculator Tool
CATEGORY: Utilities
NAME: Simple Calculator
DESCRIPTION: A simple calculator tool for basic math operations
"""

def run(params=None):
    """Main entry point"""
    if params and 'operation' in params:
        a = params.get('a', 0)
        b = params.get('b', 0)
        op = params['operation']
        
        if op == 'add':
            result = a + b
        elif op == 'subtract':
            result = a - b
        elif op == 'multiply':
            result = a * b
        elif op == 'divide':
            result = a / b if b != 0 else 'Error: Division by zero'
        else:
            result = 'Unknown operation'
        
        return {"status": "success", "result": result}
    return {"status": "success", "message": "Calculator ready"}

if __name__ == "__main__":
    result = run({'operation': 'add', 'a': 5, 'b': 3})
    print(result)
