#!/bin/bash

# ============================================================
# ChimeraAI Standalone Package Builder
# Interactive script untuk build .deb dan AppImage packages
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
DIST_DIR="$PROJECT_ROOT/dist"
BUILD_DIR="$PROJECT_ROOT/build"
RELEASE_DIR="$PROJECT_ROOT/release"

# ============================================================
# Helper Functions
# ============================================================

print_header() {
    echo -e "${CYAN}"
    echo "============================================================"
    echo "$1"
    echo "============================================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${CYAN}🔹 $1${NC}"
}

# ============================================================
# Check Prerequisites
# ============================================================

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_deps=0
    
    # Check Python
    if command -v python3 &> /dev/null; then
        print_success "Python 3: $(python3 --version)"
    else
        print_error "Python 3 not found!"
        missing_deps=1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        print_success "Node.js: $(node --version)"
    else
        print_error "Node.js not found!"
        missing_deps=1
    fi
    
    # Check Yarn
    if command -v yarn &> /dev/null; then
        print_success "Yarn: $(yarn --version)"
    else
        print_error "Yarn not found!"
        missing_deps=1
    fi
    
    # Check pip
    if command -v pip3 &> /dev/null; then
        print_success "pip3: $(pip3 --version | cut -d' ' -f2)"
    else
        print_error "pip3 not found!"
        missing_deps=1
    fi
    
    if [ $missing_deps -eq 1 ]; then
        print_error "Missing required dependencies!"
        echo ""
        echo "Please install missing dependencies:"
        echo "  - Python 3.8+: https://www.python.org/downloads/"
        echo "  - Node.js 16+: https://nodejs.org/"
        echo "  - Yarn: npm install -g yarn"
        exit 1
    fi
    
    print_success "All prerequisites satisfied!"
    echo ""
}

# ============================================================
# Install Dependencies
# ============================================================

install_dependencies() {
    print_header "Installing Dependencies"
    
    # Detect Python environment
    if [ -d "/root/.venv" ]; then
        PYTHON_BIN="/root/.venv/bin/python"
        PIP_BIN="/root/.venv/bin/pip"
        print_info "Using Python venv: /root/.venv"
    elif [ -n "$CONDA_PREFIX" ]; then
        PYTHON_BIN="$CONDA_PREFIX/bin/python"
        PIP_BIN="$CONDA_PREFIX/bin/pip"
        print_info "Using conda environment: $CONDA_DEFAULT_ENV"
    else
        PYTHON_BIN="python3"
        PIP_BIN="pip3"
        print_info "Using system Python"
    fi
    
    # Frontend dependencies
    print_step "Installing frontend dependencies..."
    cd "$PROJECT_ROOT"
    yarn install
    print_success "Frontend dependencies installed"
    
    # Backend dependencies
    print_step "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    
    # Install from modular requirements files
    print_step "Installing base dependencies..."
    $PIP_BIN install -r requirements-base.txt
    
    print_step "Installing chat dependencies..."
    $PIP_BIN install -r requirements-chat.txt
    
    print_step "Installing tools dependencies..."
    $PIP_BIN install -r requirements-tools.txt
    
    # Install PyInstaller if not present
    print_step "Checking PyInstaller..."
    if ! $PYTHON_BIN -c "import PyInstaller" 2>/dev/null; then
        print_warning "PyInstaller not found, installing..."
        $PIP_BIN install pyinstaller
    fi
    print_success "PyInstaller ready"
    
    # Install jaraco dependencies for pkg_resources fix
    print_step "Installing jaraco dependencies..."
    $PIP_BIN install jaraco.text jaraco.functools jaraco.context
    print_success "jaraco dependencies installed"
    
    print_success "Backend dependencies installed"
    echo ""
}

# ============================================================
# Clean Build Artifacts
# ============================================================

clean_build() {
    print_header "Cleaning Build Artifacts"
    
    cd "$PROJECT_ROOT"
    
    print_step "Cleaning backend build artifacts..."
    rm -rf "$BUILD_DIR/backend" "$DIST_DIR/backend"
    
    print_step "Cleaning frontend build artifacts..."
    rm -rf "$BUILD_DIR/frontend" "$DIST_DIR/frontend"
    rm -rf "$PROJECT_ROOT/dist-electron"
    
    print_step "Cleaning release directory..."
    rm -rf "$RELEASE_DIR"
    
    print_step "Cleaning packaging build..."
    rm -rf "$PROJECT_ROOT/packaging/build"
    
    print_success "Build artifacts cleaned!"
    echo ""
}

# ============================================================
# Build Backend Executable
# ============================================================

build_backend() {
    print_header "Building Backend Executable with PyInstaller"
    
    cd "$BACKEND_DIR"
    
    # Check if spec file exists
    if [ ! -f "build_backend.spec" ]; then
        print_error "build_backend.spec not found!"
        print_info "Please create PyInstaller spec file first"
        return 1
    fi
    
    print_step "Running PyInstaller with spec file..."
    
    # Detect Python environment (venv, conda, or system)
    if [ -d "/root/.venv" ]; then
        PYTHON_BIN="/root/.venv/bin/python"
        PIP_BIN="/root/.venv/bin/pip"
        PYINSTALLER_BIN="/root/.venv/bin/pyinstaller"
    elif [ -n "$CONDA_PREFIX" ]; then
        PYTHON_BIN="$CONDA_PREFIX/bin/python"
        PIP_BIN="$CONDA_PREFIX/bin/pip"
        PYINSTALLER_BIN="$CONDA_PREFIX/bin/pyinstaller"
        print_info "Using conda environment: $CONDA_DEFAULT_ENV"
    else
        PYTHON_BIN="python3"
        PIP_BIN="pip3"
        PYINSTALLER_BIN="pyinstaller"
        print_info "Using system Python"
    fi
    
    # Check if jaraco.text is installed
    if ! $PYTHON_BIN -c "import jaraco.text" 2>/dev/null; then
        print_warning "jaraco.text not found, installing..."
        $PIP_BIN install jaraco.text jaraco.functools jaraco.context
    fi
    
    $PYINSTALLER_BIN --clean build_backend.spec
    
    # PyInstaller outputs to backend/dist/, now move to project dist/backend/
    if [ -f "$BACKEND_DIR/dist/chimera-backend/chimera-backend" ]; then
        print_step "Moving build artifacts to central dist/ directory..."
        
        # Create dist directories
        mkdir -p "$DIST_DIR/backend"
        mkdir -p "$BUILD_DIR/backend"
        
        # Move dist output
        if [ -d "$DIST_DIR/backend/chimera-backend" ]; then
            rm -rf "$DIST_DIR/backend/chimera-backend"
        fi
        mv "$BACKEND_DIR/dist/chimera-backend" "$DIST_DIR/backend/"
        
        # Move build output for cleanliness
        if [ -d "$BACKEND_DIR/build" ]; then
            if [ -d "$BUILD_DIR/backend/build_backend" ]; then
                rm -rf "$BUILD_DIR/backend/build_backend"
            fi
            mv "$BACKEND_DIR/build" "$BUILD_DIR/backend/" 2>/dev/null || true
        fi
        
        # Clean up backend/dist if empty
        if [ -d "$BACKEND_DIR/dist" ]; then
            rmdir "$BACKEND_DIR/dist" 2>/dev/null || true
        fi
        
        # Make executable
        chmod +x "$DIST_DIR/backend/chimera-backend/chimera-backend"
        
        print_success "Backend executable built successfully!"
        
        # Show size
        local size=$(du -sh "$DIST_DIR/backend/chimera-backend" | cut -f1)
        print_info "Backend size: $size"
        print_info "Location: $DIST_DIR/backend/chimera-backend/"
    else
        print_error "Backend build failed!"
        print_info "Check logs above for errors"
        return 1
    fi
    
    echo ""
}

# ============================================================
# Build Frontend with Electron
# ============================================================

build_frontend() {
    print_header "Building Frontend with Electron"
    
    cd "$PROJECT_ROOT"
    
    print_step "Running Vite build..."
    yarn build
    
    if [ -d "$PROJECT_ROOT/dist" ] && [ -d "$PROJECT_ROOT/dist-electron" ]; then
        print_success "Frontend built successfully!"
        
        # Show sizes
        local frontend_size=$(du -sh "$PROJECT_ROOT/dist" | cut -f1)
        local electron_size=$(du -sh "$PROJECT_ROOT/dist-electron" | cut -f1)
        print_info "Frontend size: $frontend_size"
        print_info "Electron size: $electron_size"
    else
        print_error "Frontend build failed!"
        return 1
    fi
    
    echo ""
}

# ============================================================
# Build AppImage
# ============================================================

build_appimage() {
    print_header "Building AppImage Package"
    
    cd "$PROJECT_ROOT"
    
    # Make sure backend is built
    if [ ! -f "$DIST_DIR/backend/chimera-backend/chimera-backend" ]; then
        print_warning "Backend not built, building now..."
        build_backend
    fi
    
    # Build frontend
    print_step "Building frontend for AppImage..."
    yarn build
    
    # Create AppImage with electron-builder
    print_step "Creating AppImage..."
    yarn electron-builder --linux AppImage
    
    # Check output
    if ls "$PROJECT_ROOT/dist"/*.AppImage 1> /dev/null 2>&1; then
        # Move to release directory
        mkdir -p "$RELEASE_DIR"
        mv "$PROJECT_ROOT/dist"/*.AppImage "$RELEASE_DIR/"
        
        print_success "AppImage created successfully!"
        
        local appimage_file=$(ls "$RELEASE_DIR"/*.AppImage | head -1)
        local size=$(du -sh "$appimage_file" | cut -f1)
        print_info "AppImage: $(basename "$appimage_file")"
        print_info "Size: $size"
        print_info "Location: $RELEASE_DIR"
    else
        print_error "AppImage build failed!"
        return 1
    fi
    
    echo ""
}

# ============================================================
# Build .deb Package
# ============================================================

build_deb() {
    print_header "Building .deb Package (Phase 2)"
    
    cd "$PROJECT_ROOT"
    
    # Check if build_deb.py exists
    if [ ! -f "build_deb.py" ]; then
        print_error "build_deb.py not found!"
        print_info "Please create build_deb.py script first"
        return 1
    fi
    
    print_step "Running build_deb.py..."
    python3 build_deb.py --clean
    
    # Check if .deb was created
    if ls "$RELEASE_DIR"/*.deb 1> /dev/null 2>&1; then
        print_success ".deb package created successfully!"
        
        local deb_file=$(ls "$RELEASE_DIR"/*.deb | head -1)
        local size=$(du -sh "$deb_file" | cut -f1)
        print_info "Package: $(basename "$deb_file")"
        print_info "Size: $size"
        print_info "Location: $RELEASE_DIR"
        echo ""
        print_info "To install:"
        echo "  sudo dpkg -i $deb_file"
        echo ""
        print_info "To run:"
        echo "  chimera-ai"
    else
        print_error ".deb package build failed!"
        print_info "Check logs above for errors"
        return 1
    fi
    
    echo ""
}

# ============================================================
# Test Backend Standalone
# ============================================================

test_backend() {
    print_header "Testing Backend Executable"
    
    if [ ! -f "$DIST_DIR/backend/chimera-backend/chimera-backend" ]; then
        print_error "Backend executable not found!"
        print_info "Please build backend first (Option 2)"
        return 1
    fi
    
    cd "$DIST_DIR/backend/chimera-backend"
    
    print_step "Testing production mode (Port 18001)..."
    ./chimera-backend --port 18001 --mode production > /tmp/backend_test.log 2>&1 &
    local pid=$!
    
    sleep 10
    
    print_step "Checking health endpoint..."
    if curl -s http://localhost:18001/health | grep -q "healthy"; then
        print_success "Backend is running and healthy!"
        curl -s http://localhost:18001/health | python3 -m json.tool
    else
        print_error "Backend health check failed!"
        cat /tmp/backend_test.log
    fi
    
    # Stop backend
    kill $pid 2>/dev/null || true
    wait $pid 2>/dev/null || true
    
    print_success "Backend test complete!"
    echo ""
}

# ============================================================
# Quick Build (All)
# ============================================================

quick_build_all() {
    print_header "Quick Build - All Components"
    
    clean_build
    install_dependencies
    build_backend
    build_frontend
    build_deb
    
    print_header "Build Complete!"
    print_success "All components built successfully!"
    echo ""
    echo "📦 Build Artifacts:"
    echo "   Backend: $DIST_DIR/backend/chimera-backend/"
    echo "   Frontend: $PROJECT_ROOT/dist/"
    echo "   .deb Package: $RELEASE_DIR/"
    echo ""
}

# ============================================================
# Show Build Info
# ============================================================

show_build_info() {
    print_header "Build Information"
    
    echo "📂 Project Structure:"
    echo "   Root: $PROJECT_ROOT"
    echo "   Backend: $BACKEND_DIR"
    echo "   Dist: $DIST_DIR"
    echo "   Build: $BUILD_DIR"
    echo "   Release: $RELEASE_DIR"
    echo ""
    
    echo "🔨 Build Artifacts:"
    
    # Check backend
    if [ -f "$DIST_DIR/backend/chimera-backend/chimera-backend" ]; then
        local size=$(du -sh "$DIST_DIR/backend/chimera-backend" | cut -f1)
        print_success "Backend: Built ($size)"
    else
        print_warning "Backend: Not built"
    fi
    
    # Check frontend
    if [ -d "$PROJECT_ROOT/dist" ]; then
        local size=$(du -sh "$PROJECT_ROOT/dist" | cut -f1)
        print_success "Frontend: Built ($size)"
    else
        print_warning "Frontend: Not built"
    fi
    
    # Check .deb
    if ls "$RELEASE_DIR"/*.deb 1> /dev/null 2>&1; then
        local deb=$(ls "$RELEASE_DIR"/*.deb | head -1)
        local size=$(du -sh "$deb" | cut -f1)
        print_success ".deb Package: $(basename "$deb") ($size)"
    else
        print_warning ".deb Package: Not built"
    fi
    
    # Check AppImage
    if ls "$RELEASE_DIR"/*.AppImage 1> /dev/null 2>&1; then
        local appimage=$(ls "$RELEASE_DIR"/*.AppImage | head -1)
        local size=$(du -sh "$appimage" | cut -f1)
        print_success "AppImage: $(basename "$appimage") ($size)"
    else
        print_warning "AppImage: Not built"
    fi
    
    echo ""
    
    echo "🎯 Build Targets:"
    echo "   Development:"
    echo "     - Backend: Port 8001"
    echo "     - Frontend: Port 3000/5173"
    echo ""
    echo "   Production (.deb):"
    echo "     - Backend: Port 18001 (auto-start)"
    echo "     - Frontend: Internal Electron"
    echo ""
    echo "   Production (AppImage):"
    echo "     - Backend: Port 18002"
    echo "     - Frontend: Internal Electron"
    echo ""
}

# ============================================================
# Interactive Menu
# ============================================================

show_menu() {
    clear
    print_header "ChimeraAI Standalone Package Builder"
    
    echo "Choose an option:"
    echo ""
    echo -e "  ${GREEN}[1]${NC} 🚀 Quick Build (All) - Build everything"
    echo -e "  ${GREEN}[2]${NC} 🐍 Build Backend Only (PyInstaller)"
    echo -e "  ${GREEN}[3]${NC} ⚛️  Build Frontend Only (Electron)"
    echo -e "  ${GREEN}[4]${NC} 📦 Build AppImage Package"
    echo -e "  ${GREEN}[5]${NC} 📦 Build .deb Package (Phase 2 ✅)"
    echo ""
    echo -e "  ${YELLOW}[6]${NC} 🧪 Test Backend Executable"
    echo -e "  ${YELLOW}[7]${NC} 🧹 Clean Build Artifacts"
    echo -e "  ${YELLOW}[8]${NC} 📥 Install Dependencies"
    echo ""
    echo -e "  ${BLUE}[9]${NC} ℹ️  Show Build Information"
    echo -e "  ${BLUE}[0]${NC} 🚪 Exit"
    echo ""
    echo -ne "${CYAN}Enter your choice [0-9]: ${NC}"
}

# ============================================================
# Main Script
# ============================================================

main() {
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Check prerequisites on first run
    check_prerequisites
    
    while true; do
        show_menu
        read -r choice
        echo ""
        
        case $choice in
            1)
                quick_build_all
                ;;
            2)
                build_backend
                ;;
            3)
                build_frontend
                ;;
            4)
                build_appimage
                ;;
            5)
                build_deb
                ;;
            6)
                test_backend
                ;;
            7)
                clean_build
                ;;
            8)
                install_dependencies
                ;;
            9)
                show_build_info
                ;;
            0)
                print_header "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option: $choice"
                ;;
        esac
        
        echo ""
        echo -ne "${CYAN}Press Enter to continue...${NC}"
        read
    done
}

# Run main function
main
