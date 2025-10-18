#!/bin/bash

#############################################
# ChimeraAI Universal Development Launcher
# Works in Local & Docker Environments
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Dynamic Directory Detection
detect_project_dir() {
    # Try multiple possible locations
    if [ -n "$PROJECT_DIR" ]; then
        echo "$PROJECT_DIR"
    elif [ -f "/app/package.json" ]; then
        echo "/app"  # Docker container
    elif [ -f "$(pwd)/package.json" ]; then
        echo "$(pwd)"  # Current directory
    elif [ -f "$(dirname "$0")/package.json" ]; then
        echo "$(dirname "$0")"  # Script location
    else
        log_error "Cannot find project directory with package.json"
        exit 1
    fi
}

PROJECT_DIR=$(detect_project_dir)
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/launcher.log"

# Create logs directory
mkdir -p "$LOG_DIR"

# Clean/reset log files at start
> "$LOG_FILE"  # Reset launcher log

#############################################
# Port Management Functions
#############################################

kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        log_warning "Port $port is in use (PID: $pid), killing process..."
        kill -9 $pid 2>/dev/null || true
        sleep 1
        log_success "Port $port is now free"
    fi
}

kill_all_ports() {
    log_step "Cleaning up ports..."
    
    # Kill backend port
    kill_port 8001
    
    # Kill frontend ports  
    kill_port 5173
    kill_port 3000
    
    log_success "All ports cleaned up"
}

#############################################
# Logging Functions
#############################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] 🚀 $1${NC}" | tee -a "$LOG_FILE"
}

#############################################
# Banner
#############################################

show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ██████╗██╗  ██╗██╗███╗   ███╗███████╗██████╗  █████╗ ║
║    ██╔════╝██║  ██║██║████╗ ████║██╔════╝██╔══██╗██╔══██╗║
║    ██║     ███████║██║██╔████╔██║█████╗  ██████╔╝███████║║
║    ██║     ██╔══██║██║██║╚██╔╝██║██╔══╝  ██╔══██╗██╔══██║║
║    ╚██████╗██║  ██║██║██║ ╚═╝ ██║███████╗██║  ██║██║  ██║║
║     ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝║
║                                                           ║
║            🚀 Universal Launcher v2.0 (Phase 2)          ║
║            Backend API + Electron + React                 ║
║            (Local + Docker Support)                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

#############################################
# Environment Detection
#############################################

detect_environment() {
    log_step "Detecting environment..."
    
    if [ -f "/.dockerenv" ]; then
        echo "docker"
    elif grep -q "docker" /proc/1/cgroup 2>/dev/null; then
        echo "docker" 
    else
        echo "local"
    fi
}

ENVIRONMENT=$(detect_environment)

#############################################
# Check Functions (Environment-Aware)
#############################################

check_yarn() {
    log_step "Checking Yarn installation..."
    if ! command -v yarn &> /dev/null; then
        if [ "$ENVIRONMENT" = "docker" ]; then
            log_error "Yarn not found in Docker container!"
            log_info "Installing Yarn..."
            npm install -g yarn
        else
            log_error "Yarn is not installed!"
            log_info "Please install Yarn: npm install -g yarn"
            exit 1
        fi
    fi
    
    local yarn_version=$(yarn --version)
    log_success "Yarn installed: v$yarn_version"
}

check_node() {
    log_step "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed!"
        exit 1
    fi
    
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    log_success "Node.js installed: $node_version"
    log_success "NPM installed: v$npm_version"
}

check_electron_deps() {
    log_step "Checking Electron dependencies..."
    
    # Check if we're in Docker and need additional dependencies
    if [ "$ENVIRONMENT" = "docker" ]; then
        log_info "Checking Docker-specific dependencies..."
        
        # Check for X11/Xvfb for GUI in Docker
        if ! command -v xvfb-run &> /dev/null; then
            log_warning "Xvfb not found - GUI apps may not work in Docker"
            log_info "To install: apt-get update && apt-get install -y xvfb"
        fi
        
        # Check for basic GUI dependencies
        if ! dpkg -l | grep -q libgtk-3-0; then
            log_warning "GTK3 not installed - Electron may have issues"
        fi
    fi
}

check_dependencies() {
    log_step "Checking project dependencies..."
    
    cd "$PROJECT_DIR"
    
    # Check if node_modules exists and has content
    if [ -d "node_modules" ] && [ "$(ls -A node_modules)" ]; then
        log_success "Dependencies already installed"
        
        # Check if package.json was modified after node_modules
        if [ "package.json" -nt "node_modules" ]; then
            log_warning "package.json is newer than node_modules"
            log_info "Dependencies might be outdated"
            return 1
        fi
        
        return 0
    else
        log_warning "Dependencies not found"
        return 1
    fi
}

install_dependencies() {
    log_step "Installing dependencies..."
    
    cd "$PROJECT_DIR"
    
    log_info "Environment: $ENVIRONMENT"
    log_info "Running: yarn install --frozen-lockfile"
    echo "" | tee -a "$LOG_FILE"
    
    if yarn install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Dependencies installed successfully!"
        return 0
    else
        log_error "Failed to install dependencies"
        
        # Fallback for Docker environments
        if [ "$ENVIRONMENT" = "docker" ]; then
            log_warning "Trying alternative installation method..."
            if npm install 2>&1 | tee -a "$LOG_FILE"; then
                log_success "Dependencies installed with npm fallback!"
                return 0
            fi
        fi
        
        exit 1
    fi
}


#############################################
# Backend Functions (Phase 2)
#############################################

check_python() {
    log_step "Checking Python environment..."
    
    if command -v python3 > /dev/null 2>&1; then
        PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
        log_success "Python $PYTHON_VERSION found"
        return 0
    elif command -v python > /dev/null 2>&1; then
        PYTHON_VERSION=$(python --version | cut -d ' ' -f 2)
        log_success "Python $PYTHON_VERSION found"
        return 0
    else
        log_error "Python not found. Please install Python 3.8+"
        exit 1
    fi
}

install_backend_deps() {
    log_step "Installing backend dependencies..."
    
    if [ ! -d "$PROJECT_DIR/backend" ]; then
        log_warning "Backend directory not found, skipping..."
        return 0
    fi
    
    cd "$PROJECT_DIR/backend"
    
    if [ -f "requirements.txt" ]; then
        log_info "Installing Python packages..."
        if python3 -m pip install -q -r requirements.txt 2>&1 | tee -a "$LOG_FILE"; then
            log_success "Backend dependencies installed!"
        else
            log_error "Failed to install backend dependencies"
            exit 1
        fi
    else
        log_warning "No requirements.txt found in backend"
    fi
    
    cd "$PROJECT_DIR"
}

start_backend() {
    log_step "Starting backend API server..."
    
    if [ ! -d "$PROJECT_DIR/backend" ]; then
        log_warning "Backend directory not found, skipping..."
        return 0
    fi
    
    cd "$PROJECT_DIR/backend"
    
    # Create backend log file (fixed name, reset each run)
    BACKEND_LOG="$LOG_DIR/backend.log"
    > "$BACKEND_LOG"  # Reset backend log
    
    log_info "Starting FastAPI server on port 8001..."
    log_info "Backend logs: $BACKEND_LOG"
    
    # Start backend in background
    python3 server.py > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to start
    log_info "Waiting for backend to start..."
    sleep 3
    
    # Check if backend is running
    if curl -s http://localhost:8001/ > /dev/null 2>&1; then
        log_success "Backend API server started! (PID: $BACKEND_PID)"
        log_info "Backend API: http://localhost:8001"
        echo $BACKEND_PID > "$LOG_DIR/backend.pid"
    else
        log_error "Backend failed to start. Check $BACKEND_LOG for details"
        cat "$BACKEND_LOG" | tail -20
        exit 1
    fi
    
    cd "$PROJECT_DIR"
}

stop_backend() {
    log_step "Stopping backend server..."
    
    if [ -f "$LOG_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID 2>/dev/null || true
            log_success "Backend server stopped"
        fi
        rm "$LOG_DIR/backend.pid"
    else
        # Try to kill by port
        BACKEND_PID=$(lsof -t -i:8001 2>/dev/null)
        if [ -n "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
            log_success "Backend server stopped"
        fi
    fi
}

setup_docker_environment() {
    if [ "$ENVIRONMENT" = "docker" ]; then
        log_step "Setting up Docker environment..."
        
        # Set display for Electron in Docker
        export DISPLAY=${DISPLAY:-:99}
        
        # Start Xvfb if not running and available
        if ! pgrep -x "Xvfb" > /dev/null && command -v Xvfb > /dev/null; then
            log_info "Starting Xvfb on $DISPLAY..."
            Xvfb $DISPLAY -screen 0 1024x768x24 &
            sleep 2
        fi
        
        # Set additional Electron flags for Docker
        export ELECTRON_EXTRA_LAUNCH_ARGS="--no-sandbox --disable-dev-shm-usage"
        
        log_success "Docker environment configured"
    fi
}

#############################################
# Main Function
#############################################

start_dev_server() {
    log_step "Starting development environment..."
    
    cd "$PROJECT_DIR"
    
    # Create frontend log file (fixed name, reset each run)
    FRONTEND_LOG="$LOG_DIR/frontend.log"
    > "$FRONTEND_LOG"  # Reset frontend log
    
    log_info "Environment: $ENVIRONMENT"
    log_info "Project Directory: $PROJECT_DIR"
    
    # Start Backend API (Phase 2)
    start_backend
    
    echo ""
    log_step "Starting Electron + Vite..."
    
    # Display service info
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ChimeraAI Services Started                 ║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Backend API:${NC}      http://localhost:8001                ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Frontend (Vite):${NC} http://localhost:5173                ${GREEN}║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC} ${YELLOW}📋 Logs Location:${NC}                                      ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Launcher: $LOG_FILE                               ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Backend:  $LOG_DIR/backend.log                     ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Frontend: $FRONTEND_LOG                             ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_info "All logs are being written to fixed files (no timestamps)"
    log_info "Logs are reset on each run for clean output"
    echo ""
    log_success "Development server starting... (logs are being written to files)"
    echo ""
    
    # Set Electron flags based on environment
    if [ "$ENVIRONMENT" = "docker" ]; then
        export ELECTRON_DISABLE_SECURITY_WARNINGS=true
        
        # Start with Xvfb if available
        if command -v xvfb-run > /dev/null; then
            xvfb-run -a --server-args="-screen 0 1024x768x24" yarn dev > "$FRONTEND_LOG" 2>&1
        else
            yarn dev > "$FRONTEND_LOG" 2>&1
        fi
    else
        # Local development - redirect to log file
        yarn dev > "$FRONTEND_LOG" 2>&1
    fi
}

show_usage() {
    echo -e "${CYAN}"
    cat << "EOF"
Usage: ./launcher.sh [OPTIONS]

Options:
  -h, --help          Show this help message
  -c, --clean         Clean install dependencies
  -s, --skip-checks   Skip dependency checks
  --docker-mode       Force Docker mode
  --local-mode        Force Local mode

Examples:
  ./launcher.sh                    # Auto-detect environment
  ./launcher.sh --clean           # Clean install
  ./launcher.sh --docker-mode     # Force Docker mode
  ./launcher.sh --skip-checks     # Skip dependency checks
EOF
    echo -e "${NC}"
}

clean_install() {
    log_step "Performing clean installation..."
    cd "$PROJECT_DIR"
    rm -rf node_modules
    rm -f yarn.lock
    install_dependencies
}

#############################################
# Main Script
#############################################

main() {
    # Parse command line arguments
    SKIP_CHECKS=0
    CLEAN_INSTALL=0
    FORCE_ENVIRONMENT=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -c|--clean)
                CLEAN_INSTALL=1
                shift
                ;;
            -s|--skip-checks)
                SKIP_CHECKS=1
                shift
                ;;
            --docker-mode)
                FORCE_ENVIRONMENT="docker"
                shift
                ;;
            --local-mode)
                FORCE_ENVIRONMENT="local"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Override environment if forced
    if [ -n "$FORCE_ENVIRONMENT" ]; then
        ENVIRONMENT="$FORCE_ENVIRONMENT"
        log_info "Forced environment: $ENVIRONMENT"
    fi
    
    # Trap Ctrl+C
    trap cleanup SIGINT SIGTERM
    
    # Show banner
    show_banner
    
    log_info "ChimeraAI Universal Launcher started"
    log_info "Environment: $ENVIRONMENT"
    log_info "Project directory: $PROJECT_DIR"
    log_info "Log file: $LOG_FILE"
    echo ""
    
    # CRITICAL: Kill all ports first to avoid conflicts
    kill_all_ports
    echo ""
    
    # Skip checks if requested
    if [ $SKIP_CHECKS -eq 0 ]; then
        # Check prerequisites
        check_node
        check_yarn
        check_python  # Phase 2: Backend check
        check_electron_deps
        
        # Clean install if requested
        if [ $CLEAN_INSTALL -eq 1 ]; then
            clean_install
        else
            # Check and install dependencies
            if ! check_dependencies; then
                log_warning "Dependencies need to be installed"
                read -p "$(echo -e ${YELLOW}Install dependencies now? [Y/n]:${NC} )" -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
                    install_dependencies
                else
                    log_error "Cannot start without dependencies"
                    exit 1
                fi
            fi
        fi
        
        # Install backend dependencies (Phase 2)
        install_backend_deps
        
        # Setup Docker environment if needed
        setup_docker_environment
        
        echo ""
        log_success "All checks passed! ✅"
        echo ""
    else
        log_warning "Skipping dependency checks"
        setup_docker_environment
    fi
    
    # Start development server
    start_dev_server
}

cleanup() {
    echo ""
    log_warning "Shutting down..."
    
    # Stop backend server (Phase 2)
    stop_backend
    
    # Kill background processes in Docker
    if [ "$ENVIRONMENT" = "docker" ]; then
        pkill -f Xvfb 2>/dev/null || true
    fi
    
    log_info "Development environment stopped"
    exit 0
}

# Run main function
main "$@"