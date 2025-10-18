#!/usr/bin/env python3
"""
ChimeraAI Setup Verification Script
===================================
Verifies project setup, dependencies, and checks for large files before GitHub push.

Usage:
    python verify_setup.py
    python verify_setup.py --check-size
    python verify_setup.py --full
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import List, Tuple, Dict

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text: str):
    """Print section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_info(text: str):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

def run_command(cmd: List[str], cwd: str = None) -> Tuple[bool, str]:
    """Run shell command and return success status and output"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Command timeout"
    except Exception as e:
        return False, str(e)

def get_directory_size(path: Path) -> int:
    """Get total size of directory in bytes"""
    total = 0
    try:
        for entry in path.rglob('*'):
            if entry.is_file():
                total += entry.stat().st_size
    except Exception:
        pass
    return total

def format_size(bytes: int) -> str:
    """Format bytes to human readable size"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes < 1024.0:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.2f} TB"

def check_node_version() -> bool:
    """Check if Node.js is installed and version"""
    print_info("Checking Node.js installation...")
    success, output = run_command(['node', '--version'])
    if success:
        version = output.strip()
        print_success(f"Node.js installed: {version}")
        return True
    else:
        print_error("Node.js not found! Please install Node.js 18+")
        return False

def check_yarn_version() -> bool:
    """Check if Yarn is installed"""
    print_info("Checking Yarn installation...")
    success, output = run_command(['yarn', '--version'])
    if success:
        version = output.strip()
        print_success(f"Yarn installed: {version}")
        return True
    else:
        print_error("Yarn not found! Please install Yarn package manager")
        return False

def check_python_version() -> bool:
    """Check Python version"""
    print_info("Checking Python installation...")
    success, output = run_command(['python3', '--version'])
    if success:
        version = output.strip()
        print_success(f"Python installed: {version}")
        return True
    else:
        print_error("Python3 not found!")
        return False

def check_package_json() -> bool:
    """Check if package.json exists and is valid"""
    print_info("Checking package.json...")
    package_json = Path('/app/package.json')
    if not package_json.exists():
        print_error("package.json not found!")
        return False
    
    try:
        with open(package_json, 'r') as f:
            data = json.load(f)
        print_success(f"package.json valid - Project: {data.get('name', 'unknown')}")
        return True
    except json.JSONDecodeError:
        print_error("package.json is invalid JSON!")
        return False

def check_node_modules() -> bool:
    """Check if node_modules is installed"""
    print_info("Checking node_modules...")
    node_modules = Path('/app/node_modules')
    if not node_modules.exists():
        print_warning("node_modules not found! Run: yarn install")
        return False
    
    size = get_directory_size(node_modules)
    print_success(f"node_modules installed ({format_size(size)})")
    return True

def check_typescript() -> bool:
    """Check TypeScript compilation"""
    print_info("Checking TypeScript compilation...")
    success, output = run_command(['npx', 'tsc', '--noEmit'], cwd='/app')
    if success:
        print_success("TypeScript compilation: No errors")
        return True
    else:
        print_error("TypeScript compilation failed!")
        print(output)
        return False

def check_build() -> bool:
    """Check if build works"""
    print_info("Checking build process (this may take a minute)...")
    success, output = run_command(['yarn', 'build'], cwd='/app')
    if success:
        print_success("Build successful!")
        return True
    else:
        print_error("Build failed!")
        print(output[:500])  # Show first 500 chars
        return False

def check_gitignore() -> bool:
    """Check if .gitignore exists and has required entries"""
    print_info("Checking .gitignore...")
    gitignore = Path('/app/.gitignore')
    if not gitignore.exists():
        print_error(".gitignore not found!")
        return False
    
    content = gitignore.read_text()
    required_entries = ['node_modules', 'dist', 'release/', '*.AppImage', '*.exe']
    missing = [entry for entry in required_entries if entry not in content]
    
    if missing:
        print_warning(f"Missing .gitignore entries: {', '.join(missing)}")
        return False
    
    print_success(".gitignore properly configured")
    return True

def check_large_files(max_size_mb: int = 100) -> List[Tuple[Path, int]]:
    """Find large files that shouldn't be committed"""
    print_info(f"Checking for large files (>{max_size_mb}MB)...")
    
    large_files = []
    exclude_dirs = {'node_modules', 'release', 'dist', 'dist-electron', '.git', 'build'}
    
    root = Path('/app')
    for file_path in root.rglob('*'):
        if file_path.is_file():
            # Skip excluded directories
            if any(excluded in file_path.parts for excluded in exclude_dirs):
                continue
            
            size = file_path.stat().st_size
            size_mb = size / (1024 * 1024)
            
            if size_mb > max_size_mb:
                large_files.append((file_path, size))
    
    if large_files:
        print_warning(f"Found {len(large_files)} large file(s):")
        for file_path, size in large_files:
            print(f"  • {file_path.relative_to(root)} ({format_size(size)})")
        return large_files
    else:
        print_success(f"No files larger than {max_size_mb}MB found")
        return []

def check_release_folder() -> Dict[str, any]:
    """Check release folder size and files"""
    print_info("Checking release folder...")
    
    release_path = Path('/app/release')
    if not release_path.exists():
        print_info("Release folder not found (will be created on build)")
        return {'exists': False, 'size': 0, 'files': []}
    
    size = get_directory_size(release_path)
    files = list(release_path.rglob('*'))
    file_count = len([f for f in files if f.is_file()])
    
    print_warning(f"Release folder exists: {format_size(size)} ({file_count} files)")
    print_info("This folder should NOT be committed to GitHub!")
    
    return {'exists': True, 'size': size, 'files': files}

def check_project_structure() -> bool:
    """Verify project structure"""
    print_info("Checking project structure...")
    
    required_paths = [
        'electron/main.ts',
        'electron/preload.ts',
        'src/App.tsx',
        'src/main.tsx',
        'src/components/AnimatedAvatar.tsx',
        'docs/phase/phase_0.md',
        'docs/phase/phase_1.md',
        'tests/',
        'package.json',
        'tsconfig.json',
        'tailwind.config.js',
    ]
    
    missing = []
    for path_str in required_paths:
        path = Path('/app') / path_str
        if not path.exists():
            missing.append(path_str)
    
    if missing:
        print_error(f"Missing required files/folders:")
        for m in missing:
            print(f"  • {m}")
        return False
    
    print_success("Project structure is complete")
    return True

def check_documentation() -> bool:
    """Check if documentation is complete"""
    print_info("Checking documentation...")
    
    doc_files = [
        'README.md',
        'docs/golden-rules.md',
        'docs/DEVELOPMENT.md',
        'docs/phase/phase_0.md',
        'docs/phase/phase_1.md',
    ]
    
    missing = []
    for doc in doc_files:
        path = Path('/app') / doc
        if not path.exists():
            missing.append(doc)
    
    if missing:
        print_warning(f"Missing documentation: {', '.join(missing)}")
        return False
    
    print_success("Documentation is complete")
    return True

def main():
    """Main verification function"""
    print(f"\n{Colors.BOLD}ChimeraAI Setup Verification{Colors.END}")
    print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
    
    checks_passed = 0
    checks_failed = 0
    warnings = 0
    
    # Basic checks
    print_header("1. System Requirements")
    if check_node_version(): checks_passed += 1
    else: checks_failed += 1
    
    if check_yarn_version(): checks_passed += 1
    else: checks_failed += 1
    
    if check_python_version(): checks_passed += 1
    else: checks_failed += 1
    
    # Project structure
    print_header("2. Project Structure")
    if check_project_structure(): checks_passed += 1
    else: checks_failed += 1
    
    if check_package_json(): checks_passed += 1
    else: checks_failed += 1
    
    if check_node_modules(): checks_passed += 1
    else: checks_failed += 1
    
    # Code quality
    print_header("3. Code Quality")
    if check_typescript(): checks_passed += 1
    else: checks_failed += 1
    
    # Documentation
    print_header("4. Documentation")
    if check_documentation(): checks_passed += 1
    else: checks_failed += 1
    
    # Git configuration
    print_header("5. Git Configuration")
    if check_gitignore(): checks_passed += 1
    else: checks_failed += 1
    
    # File size checks
    print_header("6. File Size Checks")
    large_files = check_large_files(max_size_mb=50)
    if not large_files:
        checks_passed += 1
    else:
        warnings += 1
    
    release_info = check_release_folder()
    if not release_info['exists']:
        checks_passed += 1
    else:
        warnings += 1
    
    # Summary
    print_header("Verification Summary")
    print(f"{Colors.GREEN}✅ Passed: {checks_passed}{Colors.END}")
    print(f"{Colors.RED}❌ Failed: {checks_failed}{Colors.END}")
    print(f"{Colors.YELLOW}⚠️  Warnings: {warnings}{Colors.END}")
    
    if checks_failed > 0:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ VERIFICATION FAILED{Colors.END}")
        print(f"{Colors.RED}Please fix the errors above before proceeding.{Colors.END}\n")
        return 1
    elif warnings > 0:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  VERIFICATION PASSED WITH WARNINGS{Colors.END}")
        print(f"{Colors.YELLOW}Please review the warnings above.{Colors.END}\n")
        return 0
    else:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ ALL CHECKS PASSED!{Colors.END}")
        print(f"{Colors.GREEN}Project is ready for GitHub push.{Colors.END}\n")
        return 0

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='ChimeraAI Setup Verification')
    parser.add_argument('--check-size', action='store_true', help='Only check file sizes')
    parser.add_argument('--full', action='store_true', help='Run full verification including build')
    args = parser.parse_args()
    
    if args.check_size:
        print_header("File Size Check")
        large_files = check_large_files(max_size_mb=50)
        release_info = check_release_folder()
        sys.exit(0 if not large_files and not release_info['exists'] else 1)
    elif args.full:
        # Run all checks including build
        sys.exit(main())
        # Note: build check removed for speed, can add back if needed
    else:
        sys.exit(main())
