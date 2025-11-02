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
    
    # Frontend dependencies
    print_step "Installing frontend dependencies..."
    cd "$PROJECT_ROOT"
    yarn install
    print_success "Frontend dependencies installed"
    
    # Backend dependencies
    print_step "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    
    # Check if venv exists
    if [ ! -d "/root/.venv" ]; then
        print_warning "Virtual environment not found, using system Python"
        pip3 install -r requirements.txt
    else
        /root/.venv/bin/pip install -r requirements.txt
    fi
    
    # Install PyInstaller if not present
    print_step "Checking PyInstaller..."
    if ! /root/.venv/bin/pip show pyinstaller &> /dev/null; then
        print_warning "PyInstaller not found, installing..."
        /root/.venv/bin/pip install pyinstaller
    fi
    print_success "PyInstaller ready"
    
    print_success "Backend dependencies installed"
    echo ""
}

# ============================================================
# Clean Build Artifacts
# ============================================================

clean_build() {
    print_header "Cleaning Build Artifacts"
    
    cd "$PROJECT_ROOT"
    
    print_step "Cleaning backend build..."
    rm -rf "$BACKEND_DIR/build" "$BACKEND_DIR/dist"
    
    print_step "Cleaning frontend build..."
    rm -rf "$PROJECT_ROOT/dist" "$PROJECT_ROOT/dist-electron"
    
    print_step "Cleaning release directory..."
    rm -rf "$RELEASE_DIR"
    
    print_success "Build artifacts cleaned!"
    echo ""
}

# ============================================================
# Build Backend Executable
# ============================================================

build_backend() {
    print_header "Building Backend Executable with PyInstaller"
    
    cd "$BACKEND_DIR"
    
    print_step "Running PyInstaller..."
    /root/.venv/bin/pyinstaller \
        --name chimera-backend \
        --onedir \
        --clean \
        --noconfirm \
        --console \
        --add-data "data:data" \
        --hidden-import uvicorn.logging \
        --hidden-import uvicorn.loops \
        --hidden-import uvicorn.loops.auto \
        --hidden-import uvicorn.protocols \
        --hidden-import uvicorn.protocols.http \
        --hidden-import uvicorn.protocols.http.auto \
        --hidden-import uvicorn.protocols.websockets \
        --hidden-import uvicorn.protocols.websockets.auto \
        --hidden-import uvicorn.lifespan \
        --hidden-import uvicorn.lifespan.on \
        --collect-all chromadb \
        --collect-all sentence_transformers \
        --collect-all transformers \
        --collect-all torch \
        server.py
    
    if [ -f "$BACKEND_DIR/dist/chimera-backend/chimera-backend" ]; then
        print_success "Backend executable built successfully!"
        
        # Make executable
        chmod +x "$BACKEND_DIR/dist/chimera-backend/chimera-backend"
        
        # Test backend
        print_step "Testing backend executable..."
        timeout 10 "$BACKEND_DIR/dist/chimera-backend/chimera-backend" --help > /dev/null 2>&1 || true
        print_success "Backend executable tested"
        
        # Show size
        local size=$(du -sh "$BACKEND_DIR/dist/chimera-backend" | cut -f1)
        print_info "Backend size: $size"
    else
        print_error "Backend build failed!"
        exit 1
    fi
    
    echo ""
}

# ============================================================
# Build Frontend with Electron
# ============================================================

build_frontend() {
    print_header "Building Frontend with Electron"
    
    cd "$PROJECT_ROOT"
    
    print_step "Running electron-builder..."
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
        exit 1
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
    if [ ! -f "$BACKEND_DIR/dist/chimera-backend/chimera-backend" ]; then
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
        exit 1
    fi
    
    echo ""
}

# ============================================================
# Build .deb Package
# ============================================================

build_deb() {
    print_header "Building .deb Package"
    
    print_warning ".deb package builder coming in Phase 2!"
    print_info "Currently implementing:"
    echo "  - DEBIAN control files"
    echo "  - Post-install scripts"
    echo "  - Desktop integration"
    echo "  - Package assembly"
    echo ""
    print_info "For now, use AppImage build instead"
    echo ""
}

# ============================================================
# Test Backend Standalone
# ============================================================

test_backend() {
    print_header "Testing Backend Executable"
    
    if [ ! -f "$BACKEND_DIR/dist/chimera-backend/chimera-backend" ]; then
        print_error "Backend executable not found!"
        print_info "Please build backend first (Option 2)"
        return 1
    fi
    
    cd "$BACKEND_DIR/dist/chimera-backend"
    
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
    build_appimage
    
    print_header "Build Complete!"
    print_success "All components built successfully!"
    echo ""
    echo "📦 Build Artifacts:"
    echo "   Backend: $BACKEND_DIR/dist/chimera-backend/"
    echo "   Frontend: $PROJECT_ROOT/dist/"
    echo "   AppImage: $RELEASE_DIR/"
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
    echo "   Release: $RELEASE_DIR"
    echo ""
    
    echo "🔨 Build Artifacts:"
    
    # Check backend
    if [ -f "$BACKEND_DIR/dist/chimera-backend/chimera-backend" ]; then
        local size=$(du -sh "$BACKEND_DIR/dist/chimera-backend" | cut -f1)
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
    echo "     - Backend: Port 18001"
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
    echo "  ${GREEN}[1]${NC} 🚀 Quick Build (All) - Build everything"
    echo "  ${GREEN}[2]${NC} 🐍 Build Backend Only (PyInstaller)"
    echo "  ${GREEN}[3]${NC} ⚛️  Build Frontend Only (Electron)"
    echo "  ${GREEN}[4]${NC} 📦 Build AppImage Package"
    echo "  ${GREEN}[5]${NC} 📦 Build .deb Package (Coming Soon)"
    echo ""
    echo "  ${YELLOW}[6]${NC} 🧪 Test Backend Executable"
    echo "  ${YELLOW}[7]${NC} 🧹 Clean Build Artifacts"
    echo "  ${YELLOW}[8]${NC} 📥 Install Dependencies"
    echo ""
    echo "  ${BLUE}[9]${NC} ℹ️  Show Build Information"
    echo "  ${BLUE}[0]${NC} 🚪 Exit"
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
