import subprocess
import asyncio
from typing import List, Dict
import sys


class DependencyManager:
    """Manages Python package dependencies"""
    
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
