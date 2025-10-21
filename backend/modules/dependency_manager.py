import subprocess
import asyncio
from typing import List, Dict
import sys
import json
from pathlib import Path


class DependencyManager:
    """Manages Python and Node.js package dependencies"""
    
    def __init__(self):
        pass
    
    async def install_dependencies(self, dependencies: List[str]) -> Dict:
        """Install missing dependencies"""
        if not dependencies:
            return {
                "success": True,
                "message": "No dependencies to install",
                "output": ""
            }
        
        try:
            # Filter out built-in modules
            packages_to_install = [dep for dep in dependencies if dep not in sys.builtin_module_names]
            
            if not packages_to_install:
                return {
                    "success": True,
                    "message": "All dependencies are built-in modules",
                    "output": ""
                }
            
            # Install packages
            cmd = [sys.executable, "-m", "pip", "install"] + packages_to_install
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return {
                    "success": True,
                    "message": f"Successfully installed {len(packages_to_install)} packages",
                    "output": stdout.decode('utf-8')
                }
            else:
                return {
                    "success": False,
                    "message": "Installation failed",
                    "output": stderr.decode('utf-8')
                }
        
        except Exception as e:
            return {
                "success": False,
                "message": f"Installation error: {str(e)}",
                "output": str(e)
            }
    
    def check_dependency(self, package_name: str) -> bool:
        """Check if a package is installed"""
        try:
            __import__(package_name)
            return True
        except ImportError:
            return False
    
    async def get_installed_packages(self) -> List[str]:
        """Get list of installed packages"""
        try:
            process = await asyncio.create_subprocess_exec(
                sys.executable, "-m", "pip", "list", "--format=json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                import json
                packages = json.loads(stdout.decode('utf-8'))
                return [pkg["name"] for pkg in packages]
            else:
                return []
        except Exception:
            return []
    
    async def install_node_dependencies(self, tool_frontend_path: str) -> Dict:
        """Install Node.js dependencies for a frontend tool"""
        try:
            frontend_path = Path(tool_frontend_path)
            
            # Check if it's a JSX/TSX file that might have dependencies
            if frontend_path.suffix not in ['.jsx', '.tsx', '.js']:
                return {
                    "success": True,
                    "message": "No Node.js dependencies needed (not a JSX/TSX/JS file)",
                    "output": "",
                    "dependencies": []
                }
            
            # Read the frontend file to detect dependencies
            with open(frontend_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract imports (simple regex-based detection)
            detected_deps = self._detect_frontend_dependencies(content)
            
            if not detected_deps:
                return {
                    "success": True,
                    "message": "No external dependencies detected",
                    "output": "",
                    "dependencies": []
                }
            
            # Check which dependencies are missing
            installed_deps = await self._get_installed_node_packages()
            missing_deps = [dep for dep in detected_deps if dep not in installed_deps]
            
            if not missing_deps:
                return {
                    "success": True,
                    "message": f"All {len(detected_deps)} dependencies already installed",
                    "output": "",
                    "dependencies": detected_deps,
                    "installed": True
                }
            
            # Install missing dependencies using yarn
            cmd = ["yarn", "add"] + missing_deps
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(Path(__file__).parent.parent.parent)  # /app directory
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return {
                    "success": True,
                    "message": f"Successfully installed {len(missing_deps)} Node.js packages",
                    "output": stdout.decode('utf-8'),
                    "dependencies": detected_deps,
                    "installed": missing_deps
                }
            else:
                return {
                    "success": False,
                    "message": "Node.js installation failed",
                    "output": stderr.decode('utf-8'),
                    "dependencies": detected_deps
                }
        
        except Exception as e:
            return {
                "success": False,
                "message": f"Installation error: {str(e)}",
                "output": str(e),
                "dependencies": []
            }
    
    def _detect_frontend_dependencies(self, content: str) -> List[str]:
        """Detect frontend dependencies from import statements"""
        import re
        
        dependencies = set()
        
        # Match: import ... from 'package'
        # Match: import ... from "package"
        import_pattern = r"import\s+.*?\s+from\s+['\"]([^'\"\.][^'\"]*)['\"]"
        matches = re.findall(import_pattern, content)
        
        for match in matches:
            # Skip relative imports (starting with . or /)
            if not match.startswith('.') and not match.startswith('/'):
                # Extract package name (before any / for scoped packages)
                pkg_name = match.split('/')[0]
                if pkg_name.startswith('@'):
                    # Scoped package like @react/something
                    parts = match.split('/')
                    if len(parts) >= 2:
                        pkg_name = f"{parts[0]}/{parts[1]}"
                dependencies.add(pkg_name)
        
        # Match: require('package')
        require_pattern = r"require\(['\"]([^'\"\.][^'\"]*)['\"]\)"
        req_matches = re.findall(require_pattern, content)
        
        for match in req_matches:
            if not match.startswith('.') and not match.startswith('/'):
                pkg_name = match.split('/')[0]
                if pkg_name.startswith('@'):
                    parts = match.split('/')
                    if len(parts) >= 2:
                        pkg_name = f"{parts[0]}/{parts[1]}"
                dependencies.add(pkg_name)
        
        return list(dependencies)
    
    async def _get_installed_node_packages(self) -> List[str]:
        """Get list of installed Node.js packages"""
        try:
            process = await asyncio.create_subprocess_exec(
                "yarn", "list", "--json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(Path(__file__).parent.parent.parent)
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                # Parse yarn list output (each line is a JSON object)
                lines = stdout.decode('utf-8').strip().split('\n')
                packages = []
                for line in lines:
                    try:
                        data = json.loads(line)
                        if data.get('type') == 'tree':
                            # Extract package names from the tree
                            for item in data.get('data', {}).get('trees', []):
                                name = item.get('name', '')
                                if '@' in name:
                                    pkg_name = name.split('@')[0]
                                    packages.append(pkg_name)
                    except:
                        continue
                return packages
            else:
                return []
        except Exception:
            return []
    
    async def check_all_dependencies(self, tool_backend_path: str, tool_frontend_path: str, python_deps: List[str]) -> Dict:
        """Check status of all dependencies (Python and Node.js)"""
        result = {
            "python": {
                "dependencies": python_deps,
                "missing": [],
                "installed": []
            },
            "node": {
                "dependencies": [],
                "missing": [],
                "installed": []
            },
            "all_installed": False
        }
        
        # Check Python dependencies
        for dep in python_deps:
            if self.check_dependency(dep):
                result["python"]["installed"].append(dep)
            else:
                result["python"]["missing"].append(dep)
        
        # Check Node.js dependencies
        try:
            frontend_path = Path(tool_frontend_path)
            if frontend_path.suffix in ['.jsx', '.tsx', '.js']:
                with open(frontend_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                detected_deps = self._detect_frontend_dependencies(content)
                result["node"]["dependencies"] = detected_deps
                
                if detected_deps:
                    installed_node = await self._get_installed_node_packages()
                    for dep in detected_deps:
                        if dep in installed_node:
                            result["node"]["installed"].append(dep)
                        else:
                            result["node"]["missing"].append(dep)
        except Exception as e:
            result["node"]["error"] = str(e)
        
        # Check if all dependencies are installed
        result["all_installed"] = (
            len(result["python"]["missing"]) == 0 and
            len(result["node"]["missing"]) == 0
        )
        
        return result
