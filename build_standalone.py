#!/usr/bin/env python3
"""
ChimeraAI Standalone Build Script
==================================
Build production-ready AppImage with bundled Python backend.

Usage:
    python3 build_standalone.py
    python3 build_standalone.py --clean
    python3 build_standalone.py --backend-only
    python3 build_standalone.py --frontend-only
"""

import os
import sys
import subprocess
import shutil
import argparse
from pathlib import Path
from datetime import datetime

# Get project root directory (portable!)
PROJECT_ROOT = Path(__file__).parent.absolute()
BACKEND_DIR = PROJECT_ROOT / "backend"
BACKEND_DIST = BACKEND_DIR / "dist" / "chimera-backend"
RELEASE_DIR = PROJECT_ROOT / "release"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text: str):
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.END}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_step(text: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}🚀 {text}{Colors.END}")

def check_dependencies():
    """Check if required tools are installed"""
    print_step("Checking dependencies...")
    
    # Check Python
    try:
        version = subprocess.check_output(['python3', '--version']).decode().strip()
        print_success(f"Python: {version}")
    except:
        print_error("Python 3 not found!")
        return False
    
    # Check Node.js & Yarn
    try:
        node_version = subprocess.check_output(['node', '--version']).decode().strip()
        print_success(f"Node.js: {node_version}")
    except:
        print_error("Node.js not found!")
        return False
    
    try:
        yarn_version = subprocess.check_output(['yarn', '--version']).decode().strip()
        print_success(f"Yarn: {yarn_version}")
    except:
        print_error("Yarn not found!")
        return False
    
    # Check PyInstaller
    try:
        result = subprocess.run(
            ['python3', '-c', 'import PyInstaller; print(PyInstaller.__version__)'],
            capture_output=True,
            text=True,
            check=True
        )
        print_success(f"PyInstaller: {result.stdout.strip()}")
    except:
        print_error("PyInstaller not found!")
        print_info("Installing PyInstaller...")
        try:
            subprocess.run(['pip', 'install', 'pyinstaller'], check=True)
            print_success("PyInstaller installed")
        except:
            print_error("Failed to install PyInstaller")
            return False
    
    return True

def clean_build():
    """Clean previous build artifacts"""
    print_step("Cleaning previous builds...")
    
    dirs_to_clean = [
        BACKEND_DIR / "build",
        BACKEND_DIR / "dist",
        PROJECT_ROOT / "dist",
        PROJECT_ROOT / "dist-electron",
        RELEASE_DIR,
    ]
    
    for dir_path in dirs_to_clean:
        if dir_path.exists():
            print_info(f"Removing {dir_path.name}/")
            shutil.rmtree(dir_path)
    
    print_success("Clean complete")

def build_backend():
    """Build backend with PyInstaller"""
    print_header("Building Backend with PyInstaller")
    
    print_info("This will take several minutes (compiling Python + all dependencies)...")
    print_info(f"Backend directory: {BACKEND_DIR}")
    
    spec_file = BACKEND_DIR / "build_backend.spec"
    
    if not spec_file.exists():
        print_error(f"Spec file not found: {spec_file}")
        return False
    
    try:
        # Run PyInstaller
        cmd = [
            'pyinstaller',
            '--clean',
            '--noconfirm',
            str(spec_file)
        ]
        
        print_info(f"Running: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            cwd=str(BACKEND_DIR),
            check=True,
            capture_output=False
        )
        
        # Check if executable was created
        if BACKEND_DIST.exists():
            exe_path = BACKEND_DIST / "chimera-backend"
            if exe_path.exists():
                size_mb = exe_path.stat().st_size / (1024 * 1024)
                print_success(f"Backend executable built: {exe_path.name} ({size_mb:.1f} MB)")
                
                # Make executable
                os.chmod(exe_path, 0o755)
                print_success("Made executable (chmod +x)")
                
                return True
            else:
                print_error(f"Executable not found at: {exe_path}")
                return False
        else:
            print_error(f"Build directory not found: {BACKEND_DIST}")
            return False
            
    except subprocess.CalledProcessError as e:
        print_error(f"PyInstaller build failed with exit code {e.returncode}")
        return False
    except Exception as e:
        print_error(f"Backend build failed: {str(e)}")
        return False

def install_frontend_deps():
    """Install frontend dependencies if needed"""
    print_step("Checking frontend dependencies...")
    
    node_modules = PROJECT_ROOT / "node_modules"
    
    if node_modules.exists() and (PROJECT_ROOT / "package.json").stat().st_mtime < node_modules.stat().st_mtime:
        print_info("Dependencies already installed")
        return True
    
    print_info("Installing frontend dependencies...")
    
    try:
        subprocess.run(
            ['yarn', 'install', '--frozen-lockfile'],
            cwd=str(PROJECT_ROOT),
            check=True
        )
        print_success("Frontend dependencies installed")
        return True
    except:
        print_error("Failed to install frontend dependencies")
        return False

def build_frontend():
    """Build Electron app with electron-builder"""
    print_header("Building Electron App (AppImage)")
    
    print_info("Running yarn build (this will take a few minutes)...")
    
    try:
        result = subprocess.run(
            ['yarn', 'build'],
            cwd=str(PROJECT_ROOT),
            check=True,
            capture_output=False
        )
        
        print_success("Electron build completed!")
        
        # Check for AppImage
        if RELEASE_DIR.exists():
            appimages = list(RELEASE_DIR.glob("*.AppImage"))
            if appimages:
                for appimage in appimages:
                    size_mb = appimage.stat().st_size / (1024 * 1024)
                    print_success(f"AppImage created: {appimage.name} ({size_mb:.1f} MB)")
                return True
            else:
                print_warning("No AppImage found in release/ directory")
                return True  # Build succeeded but no AppImage (maybe different target)
        else:
            print_warning("Release directory not found")
            return True
            
    except subprocess.CalledProcessError as e:
        print_error(f"Electron build failed with exit code {e.returncode}")
        return False
    except Exception as e:
        print_error(f"Frontend build failed: {str(e)}")
        return False

def show_build_info():
    """Show information about built artifacts"""
    print_header("Build Complete! 🎉")
    
    # Backend info
    if BACKEND_DIST.exists():
        exe_path = BACKEND_DIST / "chimera-backend"
        if exe_path.exists():
            size_mb = exe_path.stat().st_size / (1024 * 1024)
            print(f"{Colors.GREEN}📦 Backend Executable:{Colors.END}")
            print(f"   Path: {exe_path}")
            print(f"   Size: {size_mb:.1f} MB")
            print()
    
    # AppImage info
    if RELEASE_DIR.exists():
        appimages = list(RELEASE_DIR.glob("*.AppImage"))
        if appimages:
            print(f"{Colors.GREEN}📦 AppImage(s):{Colors.END}")
            for appimage in appimages:
                size_mb = appimage.stat().st_size / (1024 * 1024)
                print(f"   • {appimage.name} ({size_mb:.1f} MB)")
                print(f"     Path: {appimage}")
            print()
            
            print(f"{Colors.CYAN}📝 Usage Instructions:{Colors.END}")
            print(f"   1. Make executable: chmod +x {appimages[0].name}")
            print(f"   2. Run: ./{appimages[0].name}")
            print(f"   3. Backend will auto-start when app opens!")
            print()
        else:
            print_info("No AppImage files found in release/")
            print_info(f"Check {RELEASE_DIR} for other build artifacts")
    else:
        print_info("Release directory not found - check build logs")
    
    print(f"{Colors.YELLOW}⚠️  Note:{Colors.END}")
    print(f"   • AppImage includes bundled Python backend (no Python needed!)")
    print(f"   • First run may take longer (extracting files)")
    print(f"   • Backend logs: Check app console or ~/.chimera-ai/logs/")

def main():
    parser = argparse.ArgumentParser(description='Build ChimeraAI standalone AppImage')
    parser.add_argument('--clean', action='store_true', help='Clean build (remove previous builds)')
    parser.add_argument('--backend-only', action='store_true', help='Build backend only')
    parser.add_argument('--frontend-only', action='store_true', help='Build frontend only (skip backend)')
    args = parser.parse_args()
    
    print(f"\n{Colors.BOLD}ChimeraAI Standalone Builder{Colors.END}")
    print(f"{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.CYAN}Project: {PROJECT_ROOT}{Colors.END}")
    print(f"{Colors.CYAN}Target: Linux AppImage with bundled backend{Colors.END}\n")
    
    # Check dependencies
    if not check_dependencies():
        print_error("Dependency check failed!")
        return 1
    
    # Clean if requested
    if args.clean:
        clean_build()
    
    # Build backend
    if not args.frontend_only:
        if not build_backend():
            print_error("Backend build failed!")
            return 1
    else:
        print_info("Skipping backend build (--frontend-only)")
    
    # Build frontend
    if not args.backend_only:
        if not install_frontend_deps():
            print_error("Frontend dependency installation failed!")
            return 1
        
        if not build_frontend():
            print_error("Frontend build failed!")
            return 1
    else:
        print_info("Skipping frontend build (--backend-only)")
    
    # Show results
    show_build_info()
    
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Build cancelled by user{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
