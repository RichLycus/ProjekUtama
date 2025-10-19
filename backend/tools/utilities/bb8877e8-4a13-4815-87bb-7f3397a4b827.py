# CATEGORY: DevTools  
# NAME: Advanced Calculator  
# DESCRIPTION: Perform advanced mathematical operations including trigonometry, logarithms, and more  
# VERSION: 1.0.0  
# AUTHOR: ChimeraAI Team  

# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import math

app = FastAPI(
    title="Advanced Calculator API",
    description="Perform advanced mathematical operations with trigonometry, logs, and constants.",
    version="1.0.0"
)

class CalcRequest(BaseModel):
    expression: str
    precision: int = 10

class CalcResponse(BaseModel):
    status: str
    expression: str
    result: float | int | str
    precision: int

@app.post("/calculate", response_model=CalcResponse)
def calculate(req: CalcRequest):
    expr = req.expression.strip()
    precision = req.precision

    if not expr:
        raise HTTPException(status_code=400, detail="Expression cannot be empty")

    # Safe evaluation namespace
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

    try:
        result = eval(expr, {"__builtins__": {}}, allowed_names)
        if isinstance(result, float):
            result = round(result, precision)
        return CalcResponse(
            status="success",
            expression=expr,
            result=result,
            precision=precision
        )
    except ZeroDivisionError:
        raise HTTPException(status_code=400, detail="Division by zero")
    except SyntaxError:
        raise HTTPException(status_code=400, detail="Invalid expression syntax")
    except NameError as e:
        raise HTTPException(status_code=400, detail=f"Unsupported function or variable: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {e}")