#!/usr/bin/env python3
"""
ChimeraAI Release Build Script
==============================
Build Electron app and prepare release artifacts for download.

Usage:
    python build_release.py
    python build_release.py --platform linux
    python build_release.py --clean
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

def clean_release_folder():
    """Clean release folder"""
    print_info("Cleaning release folder...")
    release_path = Path('/app/release')
    if release_path.exists():
        shutil.rmtree(release_path)
        print_success("Release folder cleaned")
    else:
        print_info("Release folder doesn't exist")

def run_build():
    """Run yarn build"""
    print_header("Building Electron App")
    print_info("This will take a few minutes...")
    
    try:
        result = subprocess.run(
            ['yarn', 'build'],
            cwd='/app',
            check=True,
            capture_output=False
        )
        print_success("Build completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Build failed with exit code {e.returncode}")
        return False

def get_release_info():
    """Get information about built releases"""
    release_path = Path('/app/release')
    if not release_path.exists():
        print_error("Release folder not found!")
        return []
    
    files = []
    for item in release_path.rglob('*'):
        if item.is_file() and item.suffix in ['.AppImage', '.exe', '.dmg', '.deb', '.rpm']:
            size = item.stat().st_size
            size_mb = size / (1024 * 1024)
            files.append({
                'name': item.name,
                'path': item,
                'size': size,
                'size_mb': f"{size_mb:.2f} MB"
            })
    
    return files

def create_download_instructions():
    """Create instructions for downloading release builds"""
    print_header("Release Build Information")
    
    files = get_release_info()
    
    if not files:
        print_info("No release builds found.")
        print_info("Builds are located in: /app/release/")
        return
    
    print_success(f"Found {len(files)} release build(s):")
    print()
    
    for file_info in files:
        print(f"📦 {file_info['name']}")
        print(f"   Size: {file_info['size_mb']}")
        print(f"   Path: {file_info['path']}")
        print()
    
    print_info("To download these files from your container/server:")
    print("   1. Use SCP/SFTP to transfer files")
    print("   2. Or create a temporary web server:")
    print(f"      cd /app/release")
    print(f"      python3 -m http.server 8080")
    print()

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Build ChimeraAI releases')
    parser.add_argument('--clean', action='store_true', help='Clean release folder before build')
    parser.add_argument('--info', action='store_true', help='Show release info only')
    args = parser.parse_args()
    
    print(f"\n{Colors.BOLD}ChimeraAI Release Builder{Colors.END}")
    print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
    
    if args.info:
        create_download_instructions()
        return 0
    
    if args.clean:
        clean_release_folder()
    
    # Run build
    if run_build():
        create_download_instructions()
        
        print_header("Important Notes")
        print(f"{Colors.YELLOW}⚠️  Release folder is in .gitignore{Colors.END}")
        print(f"{Colors.YELLOW}   It will NOT be committed to GitHub (files too large){Colors.END}")
        print()
        print(f"{Colors.GREEN}✅ To distribute your app:{Colors.END}")
        print(f"   1. Download release files from server")
        print(f"   2. Host on GitHub Releases (recommended)")
        print(f"   3. Or use cloud storage (Google Drive, Dropbox, etc.)")
        print()
        
        return 0
    else:
        return 1

if __name__ == '__main__':
    sys.exit(main())
