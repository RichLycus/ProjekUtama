# CATEGORY: DevTools
# NAME: Advanced Calculator
# DESCRIPTION: Perform advanced mathematical operations with scientific functions
# VERSION: 1.0.0
# AUTHOR: ChimeraAI Team

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math

app = FastAPI(
    title="Advanced Calculator API",
    description="Perform advanced mathematical operations including scientific functions",
    version="1.0.0"
)

# ✅ Add CORS middleware for iframe/cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (safe for local tools)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
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
    """
    Calculate mathematical expressions with support for:
    - Basic operations: +, -, *, /, **, %
    - Scientific functions: sin, cos, tan, sqrt, log, exp
    - Constants: pi, e
    
    Examples:
    - sqrt(16) + 4
    - sin(pi/2) * 10
    - 2 ** 8
    - log(100)
    """
    expr = req.expression.strip()
    precision = max(0, min(req.precision, 15))  # Clamp between 0-15

    if not expr:
        raise HTTPException(status_code=400, detail="Expression cannot be empty")

    # Safe evaluation namespace with allowed functions
    allowed_names = {
        "__builtins__": {},
        # Trigonometric
        "sin": math.sin,
        "cos": math.cos,
        "tan": math.tan,
        "asin": math.asin,
        "acos": math.acos,
        "atan": math.atan,
        # Exponential and logarithmic
        "sqrt": math.sqrt,
        "log": math.log,
        "log10": math.log10,
        "exp": math.exp,
        "pow": pow,
        # Rounding
        "floor": math.floor,
        "ceil": math.ceil,
        "round": round,
        "abs": abs,
        # Constants
        "pi": math.pi,
        "e": math.e,
    }

    try:
        # Evaluate expression safely
        result = eval(expr, {"__builtins__": {}}, allowed_names)
        
        # Round if float
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
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid expression: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "Advanced Calculator"}
