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
        """Check if tool has required FastAPI structure"""
        try:
            tree = ast.parse(content)
            
            # Look for FastAPI app instance: app = FastAPI()
            has_fastapi_app = False
            has_endpoint = False
            endpoints = []
            
            for node in ast.walk(tree):
                # Check: app = FastAPI() or app = FastAPI(...)
                if isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name) and target.id == 'app':
                            # Check if right side is FastAPI() call
                            if isinstance(node.value, ast.Call):
                                if hasattr(node.value.func, 'id') and node.value.func.id == 'FastAPI':
                                    has_fastapi_app = True
                                elif hasattr(node.value.func, 'attr') and node.value.func.attr == 'FastAPI':
                                    has_fastapi_app = True
                
                # Check: @app.get, @app.post, @app.put, @app.delete, @app.patch decorators
                if isinstance(node, ast.FunctionDef):
                    for decorator in node.decorator_list:
                        if isinstance(decorator, ast.Call):
                            # Check if decorator is app.method(...)
                            if hasattr(decorator.func, 'attr') and hasattr(decorator.func, 'value'):
                                if hasattr(decorator.func.value, 'id') and decorator.func.value.id == 'app':
                                    method = decorator.func.attr
                                    if method in ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']:
                                        has_endpoint = True
                                        # Extract endpoint path if available
                                        if decorator.args and isinstance(decorator.args[0], ast.Constant):
                                            endpoint_path = decorator.args[0].value
                                            endpoints.append(f"{method.upper()} {endpoint_path}")
            
            if not has_fastapi_app:
                return {
                    "valid": False,
                    "error": "Tool must have 'app = FastAPI()' instance"
                }
            
            if not has_endpoint:
                return {
                    "valid": False,
                    "error": "Tool must have at least one endpoint (@app.get, @app.post, etc.)"
                }
            
            return {
                "valid": True,
                "endpoints": endpoints
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
        """Safe test execution of the tool - check if FastAPI app can be imported"""
        try:
            # Import the module
            spec = importlib.util.spec_from_file_location("tool_module", script_path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Check if app instance exists
                if hasattr(module, 'app'):
                    # Check if it's a FastAPI instance
                    app_obj = getattr(module, 'app')
                    # Basic check - has FastAPI app attributes
                    if hasattr(app_obj, 'routes') or hasattr(app_obj, 'router'):
                        return {"valid": True}
                    else:
                        return {
                            "valid": False,
                            "error": "'app' object is not a valid FastAPI instance"
                        }
                else:
                    return {
                        "valid": False,
                        "error": "Tool does not have an 'app' object"
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
