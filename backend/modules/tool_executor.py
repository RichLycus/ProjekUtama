import subprocess
import asyncio
import json
from typing import Dict, Any
import sys
import os


class ToolExecutor:
    """Safely executes Python tools in isolated subprocess"""
    
    def __init__(self, timeout: int = 30):
        self.timeout = timeout
    
    async def execute(self, script_path: str, params: Dict[str, Any]) -> Dict:
        """Execute tool in safe subprocess"""
        try:
            # Create a wrapper script that calls the tool
            wrapper_script = f"""
import sys
import json
import importlib.util

# Load the tool
spec = importlib.util.spec_from_file_location("tool", "{script_path}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# Get parameters
params = {params}

# Execute
try:
    result = module.run(params)
    print(json.dumps({{"success": True, "result": result}}))
except Exception as e:
    print(json.dumps({{"success": False, "error": str(e)}}), file=sys.stderr)
    sys.exit(1)
"""
            
            # Execute in subprocess
            process = await asyncio.create_subprocess_exec(
                sys.executable, '-c', wrapper_script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.timeout
                )
                
                if process.returncode == 0:
                    output = stdout.decode('utf-8').strip()
                    if output:
                        result = json.loads(output)
                        return result
                    else:
                        return {"success": True, "result": "No output"}
                else:
                    error = stderr.decode('utf-8').strip()
                    return {"success": False, "error": error}
            
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                return {"success": False, "error": f"Execution timeout ({self.timeout}s)"}
        
        except Exception as e:
            return {"success": False, "error": f"Execution failed: {str(e)}"}
    
    async def execute_streaming(self, script_path: str, params: Dict[str, Any]):
        """Execute tool and stream output line by line"""
        wrapper_script = f"""
import sys
import json
import importlib.util

# Load the tool
spec = importlib.util.spec_from_file_location("tool", "{script_path}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# Get parameters
params = {params}

# Execute
try:
    result = module.run(params)
    print("RESULT:", json.dumps(result))
except Exception as e:
    print("ERROR:", str(e), file=sys.stderr)
    sys.exit(1)
"""
        
        process = await asyncio.create_subprocess_exec(
            sys.executable, '-c', wrapper_script,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Stream stdout
        async for line in process.stdout:
            yield line.decode('utf-8').strip()
        
        await process.wait()
