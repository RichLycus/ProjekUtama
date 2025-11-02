#!/usr/bin/env python3
"""
ChimeraAI .deb Package Builder

Builds a production-ready Debian package (.deb) for ChimeraAI:
1. Build backend executable with PyInstaller
2. Build frontend with electron-builder
3. Package everything into .deb format
4. Include DEBIAN control files
5. Create desktop entry

Usage:
    python3 build_deb.py [--clean] [--backend-only] [--frontend-only]
"""

import os
import sys
import shutil
import subprocess
import argparse
from pathlib import Path
import json

# Colors for output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def log(message, level="INFO"):
    """Print colored log message"""
    color = Colors.OKBLUE
    if level == "SUCCESS":
        color = Colors.OKGREEN
    elif level == "ERROR":
        color = Colors.FAIL
    elif level == "WARNING":
        color = Colors.WARNING
    elif level == "HEADER":
        color = Colors.HEADER
    
    print(f"{color}[{level}]{Colors.ENDC} {message}")

def run_command(cmd, cwd=None, shell=False):
    """Run shell command and return success status"""
    try:
        if shell:
            result = subprocess.run(cmd, cwd=cwd, shell=True, check=True, 
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        else:
            result = subprocess.run(cmd, cwd=cwd, check=True,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True, result.stdout.decode('utf-8')
    except subprocess.CalledProcessError as e:
        return False, e.stderr.decode('utf-8')

def clean_builds():
    """Clean all build artifacts"""
    log("Cleaning build artifacts...", "INFO")
    
    project_root = get_project_root()
    
    dirs_to_clean = [
        project_root / 'backend/build',
        project_root / 'backend/dist',
        project_root / 'dist',
        project_root / 'dist-electron',
        project_root / 'release',
        project_root / 'packaging/build',
    ]
    
    for dir_path in dirs_to_clean:
        path = Path(dir_path)
        if path.exists():
            shutil.rmtree(path)
            log(f"Removed: {dir_path}", "SUCCESS")
    
    log("Clean complete!", "SUCCESS")

def get_project_root():
    """Get project root directory (where this script is located)"""
    return Path(__file__).parent.absolute()

def build_backend():
    """Build backend executable with PyInstaller"""
    log("="*60, "HEADER")
    log("STEP 1: Building Backend Executable (PyInstaller)", "HEADER")
    log("="*60, "HEADER")
    
    project_root = get_project_root()
    backend_dir = project_root / 'backend'
    
    # Check Python dependencies first
    log("Checking backend dependencies...", "INFO")
    req_files = [
        backend_dir / 'requirements-base.txt',
        backend_dir / 'requirements-chat.txt',
        backend_dir / 'requirements-tools.txt'
    ]
    
    for req_file in req_files:
        if req_file.exists():
            log(f"Installing {req_file.name}...", "INFO")
            success, output = run_command([sys.executable, '-m', 'pip', 'install', '-r', str(req_file)])
            if not success:
                log(f"Failed to install {req_file.name}!", "WARNING")
        else:
            log(f"{req_file.name} not found, skipping...", "WARNING")
    
    # Check if PyInstaller is installed
    log("Checking PyInstaller...", "INFO")
    success, output = run_command(['pyinstaller', '--version'])
    if not success:
        log("PyInstaller not found! Installing...", "WARNING")
        success, output = run_command([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
        if not success:
            log("Failed to install PyInstaller!", "ERROR")
            return False
    
    log(f"PyInstaller version: {output.strip()}", "SUCCESS")
    
    # Check if spec file exists
    spec_file = backend_dir / 'build_backend.spec'
    if not spec_file.exists():
        log(f"Spec file not found: {spec_file}", "ERROR")
        return False
    
    log(f"Using spec file: {spec_file}", "INFO")
    
    # Run PyInstaller
    log("Running PyInstaller (this may take 3-5 minutes)...", "INFO")
    success, output = run_command(
        ['pyinstaller', '--clean', 'build_backend.spec'],
        cwd=backend_dir
    )
    
    if not success:
        log("Backend build failed!", "ERROR")
        log(output, "ERROR")
        return False
    
    # Check if executable was created
    backend_exe = backend_dir / 'dist' / 'chimera-backend' / 'chimera-backend'
    if not backend_exe.exists():
        log(f"Backend executable not found: {backend_exe}", "ERROR")
        return False
    
    # Get size
    size_mb = backend_exe.stat().st_size / (1024 * 1024)
    log(f"Backend executable created: {backend_exe}", "SUCCESS")
    log(f"Size: {size_mb:.1f} MB", "INFO")
    
    # Test backend executable
    log("Testing backend executable...", "INFO")
    success, output = run_command(
        [str(backend_exe), '--help'],
        cwd=backend_dir
    )
    
    if not success:
        log("Backend executable test failed!", "WARNING")
        log("This might be okay, continuing...", "WARNING")
    else:
        log("Backend executable works!", "SUCCESS")
    
    return True

def build_frontend():
    """Build frontend with electron-builder"""
    log("="*60, "HEADER")
    log("STEP 2: Building Frontend (Electron)", "HEADER")
    log("="*60, "HEADER")
    
    project_root = get_project_root()
    
    # Check if node_modules exists
    if not (project_root / 'node_modules').exists():
        log("node_modules not found! Running yarn install...", "WARNING")
        success, output = run_command(['yarn', 'install'], cwd=str(project_root))
        if not success:
            log("yarn install failed!", "ERROR")
            return False
    
    # Build frontend with Vite (use npx directly to avoid yarn E2BIG error)
    log("Building frontend with Vite...", "INFO")
    
    # Try vite build directly to avoid yarn E2BIG error
    success, output = run_command(['npx', 'vite', 'build'], cwd=str(project_root))
    
    # If npx fails, try yarn build
    if not success:
        log("npx vite build failed, trying yarn build...", "WARNING")
        success, output = run_command(['yarn', 'build'], cwd=str(project_root))
        
    if not success:
        log("Frontend build failed!", "ERROR")
        log(output, "ERROR")
        return False
    
    log("Frontend build complete!", "SUCCESS")
    
    # Check if dist folder exists
    dist_dir = project_root / 'dist'
    if not dist_dir.exists():
        log(f"Frontend dist not found: {dist_dir}", "ERROR")
        return False
    
    return True

def create_deb_structure():
    """Create .deb package directory structure"""
    log("="*60, "HEADER")
    log("STEP 3: Creating .deb Package Structure", "HEADER")
    log("="*60, "HEADER")
    
    project_root = get_project_root()
    
    # Get version from package.json
    with open(project_root / 'package.json', 'r') as f:
        package_data = json.load(f)
        version = package_data.get('version', '1.0.0')
    
    log(f"Package version: {version}", "INFO")
    
    # Create build directory
    build_dir = project_root / 'packaging/build/chimera-ai'
    if build_dir.exists():
        shutil.rmtree(build_dir)
    build_dir.mkdir(parents=True)
    
    # Create directory structure
    dirs = [
        build_dir / 'opt/chimera-ai/bin',
        build_dir / 'opt/chimera-ai/lib/resources',
        build_dir / 'opt/chimera-ai/share/icons',
        build_dir / 'opt/chimera-ai/share/doc',
        build_dir / 'opt/chimera-ai/data/database',
        build_dir / 'usr/bin',
        build_dir / 'usr/share/applications',
        build_dir / 'usr/share/icons/hicolor/256x256/apps',
        build_dir / 'var/log/chimera-ai',
        build_dir / 'DEBIAN',
    ]
    
    for dir_path in dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
        log(f"Created: {dir_path.relative_to(build_dir.parent)}", "SUCCESS")
    
    log("Directory structure created!", "SUCCESS")
    return build_dir, version

def copy_files_to_deb(build_dir):
    """Copy application files to .deb structure"""
    log("="*60, "HEADER")
    log("STEP 4: Copying Application Files", "HEADER")
    log("="*60, "HEADER")
    
    project_root = get_project_root()
    opt_dir = build_dir / 'opt/chimera-ai'
    
    # Copy backend executable
    log("Copying backend executable...", "INFO")
    backend_src = project_root / 'backend/dist/chimera-backend'
    backend_dst = opt_dir / 'bin'
    if backend_src.exists():
        shutil.copytree(backend_src, backend_dst / 'chimera-backend', dirs_exist_ok=True)
        # Make executable
        (backend_dst / 'chimera-backend/chimera-backend').chmod(0o755)
        log("Backend copied!", "SUCCESS")
    else:
        log(f"Backend not found: {backend_src}", "ERROR")
        return False
    
    # Copy frontend dist
    log("Copying frontend files...", "INFO")
    frontend_src = project_root / 'dist'
    frontend_dst = opt_dir / 'lib/resources/app'
    if frontend_src.exists():
        shutil.copytree(frontend_src, frontend_dst, dirs_exist_ok=True)
        log("Frontend copied!", "SUCCESS")
    else:
        log(f"Frontend dist not found: {frontend_src}", "ERROR")
        return False
    
    # Copy electron main
    log("Copying Electron main process...", "INFO")
    electron_src = project_root / 'dist-electron'
    if electron_src.exists():
        shutil.copytree(electron_src, opt_dir / 'lib/resources/electron', dirs_exist_ok=True)
        log("Electron main copied!", "SUCCESS")
    
    # Copy database template
    log("Copying database template...", "INFO")
    db_src = project_root / 'backend/data/chimera_tools.db'
    db_dst = opt_dir / 'data/database/chimera_tools.db'
    if db_src.exists():
        shutil.copy2(db_src, db_dst)
        log("Database template copied!", "SUCCESS")
    
    # Copy icon
    log("Copying application icon...", "INFO")
    icon_src = project_root / 'build/icon.png'
    if icon_src.exists():
        # Copy to /opt/chimera-ai/share/icons/
        shutil.copy2(icon_src, opt_dir / 'share/icons/chimera-ai.png')
        # Copy to /usr/share/icons/hicolor/256x256/apps/
        shutil.copy2(icon_src, build_dir / 'usr/share/icons/hicolor/256x256/apps/chimera-ai.png')
        log("Icon copied!", "SUCCESS")
    else:
        log("Icon not found, skipping...", "WARNING")
    
    # Create launcher script
    log("Creating launcher script...", "INFO")
    launcher_script = build_dir / 'opt/chimera-ai/bin/chimera-ai'
    with open(launcher_script, 'w') as f:
        f.write('''#!/bin/bash
# ChimeraAI Launcher Script

APP_DIR="/opt/chimera-ai"
USER_DATA="${HOME}/.local/share/chimera-ai"
USER_CONFIG="${HOME}/.config/chimera-ai"

# Create user directories if not exist
mkdir -p "${USER_DATA}/database" "${USER_DATA}/logs" "${USER_CONFIG}"

# Initialize database if not exists
if [ ! -f "${USER_DATA}/database/chimera_tools.db" ]; then
    cp "${APP_DIR}/data/database/chimera_tools.db" "${USER_DATA}/database/"
fi

# Launch Electron app
cd "${APP_DIR}"
exec electron "${APP_DIR}/lib/resources/electron/main.js" "$@"
''')
    launcher_script.chmod(0o755)
    log("Launcher script created!", "SUCCESS")
    
    # Create symlink
    log("Creating symlink in /usr/bin...", "INFO")
    symlink = build_dir / 'usr/bin/chimera-ai'
    symlink_target = '/opt/chimera-ai/bin/chimera-ai'
    symlink.symlink_to(symlink_target)
    log(f"Symlink: {symlink} -> {symlink_target}", "SUCCESS")
    
    return True

def copy_debian_files(build_dir, version):
    """Copy DEBIAN control files"""
    log("="*60, "HEADER")
    log("STEP 5: Setting Up DEBIAN Control Files", "HEADER")
    log("="*60, "HEADER")
    
    project_root = get_project_root()
    debian_src = project_root / 'packaging/DEBIAN'
    debian_dst = build_dir / 'DEBIAN'
    
    if not debian_src.exists():
        log(f"DEBIAN directory not found: {debian_src}", "ERROR")
        return False
    
    # Copy control files
    for file in debian_src.iterdir():
        if file.is_file():
            dst_file = debian_dst / file.name
            shutil.copy2(file, dst_file)
            dst_file.chmod(0o755)
            log(f"Copied: {file.name}", "SUCCESS")
            
            # Update version in control file
            if file.name == 'control':
                with open(dst_file, 'r') as f:
                    content = f.read()
                content = content.replace('Version: 1.0.0', f'Version: {version}')
                with open(dst_file, 'w') as f:
                    f.write(content)
                log(f"Updated version to {version} in control file", "INFO")
    
    # Copy desktop entry
    log("Copying desktop entry...", "INFO")
    desktop_src = project_root / 'packaging/chimera-ai.desktop'
    desktop_dst = build_dir / 'usr/share/applications/chimera-ai.desktop'
    if desktop_src.exists():
        shutil.copy2(desktop_src, desktop_dst)
        desktop_dst.chmod(0o644)
        log("Desktop entry copied!", "SUCCESS")
    
    return True

def build_deb_package(build_dir, version):
    """Build .deb package with dpkg-deb"""
    log("="*60, "HEADER")
    log("STEP 6: Building .deb Package", "HEADER")
    log("="*60, "HEADER")
    
    project_root = get_project_root()
    
    # Create release directory
    release_dir = project_root / 'release'
    release_dir.mkdir(exist_ok=True)
    
    deb_filename = f'chimera-ai_{version}_amd64.deb'
    deb_path = release_dir / deb_filename
    
    log(f"Building: {deb_filename}", "INFO")
    log("This may take a minute...", "INFO")
    
    # Build .deb package
    success, output = run_command(
        f'dpkg-deb --build --root-owner-group {build_dir} {deb_path}',
        shell=True
    )
    
    if not success:
        log(".deb build failed!", "ERROR")
        log(output, "ERROR")
        return False
    
    if not deb_path.exists():
        log(f".deb file not created: {deb_path}", "ERROR")
        return False
    
    # Get package size
    size_mb = deb_path.stat().st_size / (1024 * 1024)
    
    log("="*60, "HEADER")
    log("BUILD COMPLETE!", "SUCCESS")
    log("="*60, "HEADER")
    log(f"Package: {deb_path}", "SUCCESS")
    log(f"Size: {size_mb:.1f} MB", "INFO")
    log("", "INFO")
    log("To install:", "INFO")
    log(f"  sudo dpkg -i {deb_path}", "INFO")
    log("", "INFO")
    log("To run:", "INFO")
    log("  chimera-ai", "INFO")
    log("="*60, "HEADER")
    
    return True

def main():
    """Main build function"""
    parser = argparse.ArgumentParser(description='Build ChimeraAI .deb package')
    parser.add_argument('--clean', action='store_true', help='Clean build artifacts first')
    parser.add_argument('--backend-only', action='store_true', help='Build backend only')
    parser.add_argument('--frontend-only', action='store_true', help='Build frontend only (requires existing backend)')
    
    args = parser.parse_args()
    
    log("="*60, "HEADER")
    log("ChimeraAI .deb Package Builder", "HEADER")
    log("="*60, "HEADER")
    log("", "INFO")
    
    # Clean if requested
    if args.clean:
        clean_builds()
        log("", "INFO")
    
    # Build backend
    if not args.frontend_only:
        if not build_backend():
            log("Build failed at backend step!", "ERROR")
            return 1
        log("", "INFO")
    
    # Stop here if backend-only
    if args.backend_only:
        log("Backend-only build complete!", "SUCCESS")
        log("Backend executable: backend/dist/chimera-backend/chimera-backend", "INFO")
        return 0
    
    # Build frontend
    if not build_frontend():
        log("Build failed at frontend step!", "ERROR")
        return 1
    log("", "INFO")
    
    # Create .deb structure
    build_dir, version = create_deb_structure()
    log("", "INFO")
    
    # Copy files
    if not copy_files_to_deb(build_dir):
        log("Build failed at file copy step!", "ERROR")
        return 1
    log("", "INFO")
    
    # Copy DEBIAN files
    if not copy_debian_files(build_dir, version):
        log("Build failed at DEBIAN files step!", "ERROR")
        return 1
    log("", "INFO")
    
    # Build .deb package
    if not build_deb_package(build_dir, version):
        log("Build failed at packaging step!", "ERROR")
        return 1
    
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log("\nBuild cancelled by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        log(f"Unexpected error: {str(e)}", "ERROR")
        import traceback
        traceback.print_exc()
        sys.exit(1)
