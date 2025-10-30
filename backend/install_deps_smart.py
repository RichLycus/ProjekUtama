#!/usr/bin/env python3
"""
ChimeraAI Smart Dependency Installer
Installs Python dependencies with version compatibility checks
Python 3.11+ compatible
"""

import sys
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Set, Tuple

# Color codes
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color


def log_info(msg: str):
    print(f"{BLUE}ℹ️  {msg}{NC}")


def log_success(msg: str):
    print(f"{GREEN}✅ {msg}{NC}")


def log_warning(msg: str):
    print(f"{YELLOW}⚠️  {msg}{NC}")


def log_error(msg: str):
    print(f"{RED}❌ {msg}{NC}")


def check_python_version() -> Tuple[bool, str]:
    """Check if Python version is 3.11+"""
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        return False, version_str
    
    return True, version_str


def get_installed_packages() -> Dict[str, str]:
    """Get list of installed packages with versions"""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--format=json"],
            capture_output=True,
            text=True,
            check=True
        )
        packages = json.loads(result.stdout)
        return {pkg["name"].lower(): pkg["version"] for pkg in packages}
    except Exception as e:
        log_warning(f"Failed to get installed packages: {e}")
        return {}


def parse_requirements_file(file_path: Path) -> List[str]:
    """Parse requirements.txt file"""
    if not file_path.exists():
        return []
    
    requirements = []
    with open(file_path, 'r') as f:
        for line in f:
            line = line.strip()
            # Skip comments and empty lines
            if line and not line.startswith('#'):
                requirements.append(line)
    
    return requirements


def extract_package_name(requirement: str) -> str:
    """Extract package name from requirement string"""
    # Handle package==version, package>=version, etc.
    for op in ['==', '>=', '<=', '>', '<', '~=']:
        if op in requirement:
            return requirement.split(op)[0].strip()
    return requirement.strip()


def compare_versions(current: str, required: str) -> bool:
    """Simple version comparison (current >= required)"""
    try:
        # Convert version strings to tuples of integers
        current_parts = [int(x) for x in current.split('.')]
        required_parts = [int(x) for x in required.split('.')]
        
        # Pad shorter version with zeros
        max_len = max(len(current_parts), len(required_parts))
        current_parts += [0] * (max_len - len(current_parts))
        required_parts += [0] * (max_len - len(required_parts))
        
        return current_parts >= required_parts
    except:
        # If comparison fails, assume needs update
        return False


def install_requirements_smart(
    requirements_file: Path,
    installed_packages: Dict[str, str],
    force: bool = False
) -> Tuple[bool, List[str], List[str]]:
    """
    Smart install: only install missing or outdated packages
    
    Returns:
        (success, installed_packages, skipped_packages)
    """
    requirements = parse_requirements_file(requirements_file)
    
    if not requirements:
        log_info(f"No requirements in {requirements_file.name}")
        return True, [], []
    
    to_install = []
    skipped = []
    
    for req in requirements:
        pkg_name = extract_package_name(req).lower()
        
        # Check if already installed
        if pkg_name in installed_packages and not force:
            # Check version if specified
            if '==' in req:
                required_version = req.split('==')[1].strip()
                current_version = installed_packages[pkg_name]
                
                if current_version == required_version:
                    skipped.append(f"{pkg_name}=={current_version}")
                    continue
                elif compare_versions(current_version, required_version):
                    log_warning(
                        f"{pkg_name}: current={current_version}, required={required_version} "
                        f"(keeping current, no downgrade)"
                    )
                    skipped.append(f"{pkg_name}=={current_version}")
                    continue
            else:
                skipped.append(f"{pkg_name}=={installed_packages[pkg_name]}")
                continue
        
        to_install.append(req)
    
    if not to_install:
        log_success(f"All packages from {requirements_file.name} already installed!")
        return True, [], skipped
    
    log_info(f"Installing {len(to_install)} packages from {requirements_file.name}...")
    
    # Install packages
    try:
        cmd = [sys.executable, "-m", "pip", "install", "--no-deps"] + to_install
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        log_success(f"Installed {len(to_install)} packages from {requirements_file.name}")
        return True, to_install, skipped
        
    except subprocess.CalledProcessError as e:
        log_error(f"Installation failed: {e.stderr}")
        return False, [], skipped


def install_dependencies_with_deps(packages: List[str]) -> bool:
    """Install packages with their dependencies (second pass)"""
    if not packages:
        return True
    
    log_info("Installing package dependencies (second pass)...")
    
    try:
        cmd = [sys.executable, "-m", "pip", "install"] + packages
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        log_success("Dependencies installed!")
        return True
    except subprocess.CalledProcessError as e:
        log_error(f"Dependency installation failed: {e.stderr}")
        return False


def main():
    print("=" * 60)
    print("🐍 ChimeraAI Smart Dependency Installer")
    print("=" * 60)
    print()
    
    # Check Python version
    is_compatible, version = check_python_version()
    if not is_compatible:
        log_error(f"Python {version} is not supported!")
        log_error("ChimeraAI requires Python 3.11 or higher")
        sys.exit(1)
    
    log_success(f"Python {version} - Compatible ✓")
    print()
    
    # Get backend directory
    backend_dir = Path(__file__).parent
    
    # Define requirements files
    req_files = [
        backend_dir / "requirements-base.txt",
        backend_dir / "requirements-chat.txt",
        backend_dir / "requirements-tools.txt"
    ]
    
    # Get currently installed packages
    log_info("Scanning installed packages...")
    installed_packages = get_installed_packages()
    log_info(f"Found {len(installed_packages)} installed packages")
    print()
    
    all_installed = []
    all_success = True
    
    # Install requirements in order
    for req_file in req_files:
        if not req_file.exists():
            log_warning(f"Requirements file not found: {req_file.name}")
            continue
        
        print(f"📦 Processing: {req_file.name}")
        print("-" * 60)
        
        success, installed, skipped = install_requirements_smart(
            req_file,
            installed_packages,
            force=False
        )
        
        if not success:
            all_success = False
            log_error(f"Failed to install requirements from {req_file.name}")
        else:
            if installed:
                all_installed.extend(installed)
                log_info(f"Installed: {len(installed)} packages")
            if skipped:
                log_info(f"Skipped (already installed): {len(skipped)} packages")
        
        print()
    
    # Second pass: install dependencies of newly installed packages
    if all_installed:
        print("📦 Installing package dependencies...")
        print("-" * 60)
        install_dependencies_with_deps(all_installed)
        print()
    
    # Summary
    print("=" * 60)
    if all_success:
        log_success("✨ All dependencies installed successfully!")
    else:
        log_error("Some dependencies failed to install")
        sys.exit(1)
    print("=" * 60)


if __name__ == "__main__":
    main()
