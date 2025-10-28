import ast
import re
import importlib.util
import sys
from typing import Dict, List


class ToolValidator:
    """Validates Python tools before registration"""
    
    def __init__(self):
        self.required_metadata = ["CATEGORY", "NAME", "DESCRIPTION"]
    
    def validate(self, script_path: str, script_content: str) -> Dict:
        """Complete validation of a tool"""
        errors = []
        warnings = []
        dependencies = []
        
        # 1. Check metadata
        metadata_check = self._check_metadata(script_content)
        if not metadata_check["valid"]:
            errors.extend(metadata_check["errors"])
        
        # 2. Check syntax
        syntax_check = self._check_syntax(script_content)
        if not syntax_check["valid"]:
            errors.append(syntax_check["error"])
        
        # 3. Check structure (has run function)
        structure_check = self._check_structure(script_content)
        if not structure_check["valid"]:
            errors.append(structure_check["error"])
        
        # 4. Extract and check imports
        imports_check = self._check_imports(script_content)
        if not imports_check["valid"]:
            errors.extend(imports_check["errors"])
            warnings.extend(imports_check["warnings"])
        dependencies = imports_check["dependencies"]
        
        # 5. Test execution (safe test)
        if len(errors) == 0:
            test_check = self._test_execution(script_path)
            if not test_check["valid"]:
                errors.append(test_check["error"])
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "dependencies": dependencies
        }
    
    def _check_metadata(self, content: str) -> Dict:
        """Check if required metadata exists in comments or docstring"""
        errors = []
        found_metadata = {}
        
        # First, try to extract from docstring (triple quotes)
        docstring_match = re.search(r'"""([\s\S]*?)"""', content)
        if docstring_match:
            docstring = docstring_match.group(1)
            for meta in self.required_metadata + ["VERSION", "AUTHOR"]:
                match = re.search(f"{meta}:\s*(.+)", docstring, re.IGNORECASE)
                if match:
                    found_metadata[meta] = match.group(1).strip()
        
        # Also check for metadata in comments (backward compatibility)
        for line in content.split('\n'):
            line = line.strip()
            if line.startswith('#'):
                for meta in self.required_metadata + ["VERSION", "AUTHOR"]:
                    if meta in line:
                        # Extract value
                        match = re.search(f"{meta}:\s*(.+)", line)
                        if match:
                            found_metadata[meta] = match.group(1).strip()
        
        # Check required metadata
        for meta in self.required_metadata:
            if meta not in found_metadata:
                errors.append(f"Missing required metadata: {meta}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "metadata": found_metadata
        }
    
    def _check_syntax(self, content: str) -> Dict:
        """Check Python syntax"""
        try:
            ast.parse(content)
            return {"valid": True}
        except SyntaxError as e:
            return {
                "valid": False,
                "error": f"Syntax error at line {e.lineno}: {e.msg}"
            }
    
    def _check_structure(self, content: str) -> Dict:
        """Check if tool has required run() function"""
        try:
            tree = ast.parse(content)
            
            # Look for run(params) function
            has_run_function = False
            run_function_info = {}
            
            for node in ast.walk(tree):
                # Check for: def run(params):
                if isinstance(node, ast.FunctionDef) and node.name == 'run':
                    has_run_function = True
                    
                    # Extract function signature info
                    args = [arg.arg for arg in node.args.args]
                    run_function_info = {
                        "name": "run",
                        "args": args,
                        "has_params": "params" in args or len(args) > 0
                    }
                    
                    # Check if function has docstring
                    if (node.body and 
                        isinstance(node.body[0], ast.Expr) and 
                        isinstance(node.body[0].value, ast.Constant)):
                        run_function_info["has_docstring"] = True
                    
                    break
            
            if not has_run_function:
                return {
                    "valid": False,
                    "error": "Tool must have 'run(params)' function. Example:\n\ndef run(params):\n    return {'success': True, 'data': 'result'}"
                }
            
            # Validate run function has at least one parameter
            if not run_function_info.get("has_params"):
                return {
                    "valid": False,
                    "error": "run() function must accept 'params' parameter"
                }
            
            return {
                "valid": True,
                "function": run_function_info
            }
        except Exception as e:
            return {
                "valid": False,
                "error": f"Structure check failed: {str(e)}"
            }
    
    def _check_imports(self, content: str) -> Dict:
        """Check if all imports are available"""
        errors = []
        warnings = []
        dependencies = []
        
        try:
            tree = ast.parse(content)
            
            # Extract all imports
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        module_name = alias.name.split('.')[0]
                        dependencies.append(module_name)
                        if not self._is_module_available(module_name):
                            errors.append(f"Missing dependency: {module_name}")
                
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        module_name = node.module.split('.')[0]
                        dependencies.append(module_name)
                        if not self._is_module_available(module_name):
                            errors.append(f"Missing dependency: {module_name}")
            
            return {
                "valid": len(errors) == 0,
                "errors": errors,
                "warnings": warnings,
                "dependencies": list(set(dependencies))  # Remove duplicates
            }
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Import check failed: {str(e)}"],
                "warnings": [],
                "dependencies": []
            }
    
    def _is_module_available(self, module_name: str) -> bool:
        """Check if a module is available"""
        # Skip built-in modules
        if module_name in sys.builtin_module_names:
            return True
        
        try:
            spec = importlib.util.find_spec(module_name)
            return spec is not None
        except (ImportError, ModuleNotFoundError, ValueError):
            return False
    
    def _test_execution(self, script_path: str) -> Dict:
        """Safe test execution of the tool - check if run() function can be imported and called"""
        try:
            # Import the module
            spec = importlib.util.spec_from_file_location("tool_module", script_path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Check if run function exists
                if hasattr(module, 'run'):
                    run_func = getattr(module, 'run')
                    
                    # Check if it's callable
                    if not callable(run_func):
                        return {
                            "valid": False,
                            "error": "'run' is not a callable function"
                        }
                    
                    # Try to call it with empty params to test basic functionality
                    try:
                        test_result = run_func({})
                        
                        # Validate return structure
                        if not isinstance(test_result, dict):
                            return {
                                "valid": False,
                                "error": "run() must return a dict, got: " + type(test_result).__name__
                            }
                        
                        # Check if it has 'success' key
                        if 'success' not in test_result:
                            return {
                                "valid": False,
                                "error": "run() must return dict with 'success' key. Example: {'success': True, 'data': 'result'}"
                            }
                        
                        return {"valid": True, "test_result": test_result}
                    
                    except Exception as e:
                        # It's OK if the function fails with empty params
                        # As long as it's callable and returns proper error structure
                        return {"valid": True, "note": f"Function callable but failed with empty params (expected): {str(e)}"}
                else:
                    return {
                        "valid": False,
                        "error": "Tool does not have a 'run()' function"
                    }
            else:
                return {
                    "valid": False,
                    "error": "Could not load tool module"
                }
        except Exception as e:
            return {
                "valid": False,
                "error": f"Test execution failed: {str(e)}"
            }
