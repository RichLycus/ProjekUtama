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
LOG_FILE="$LOG_DIR/launcher_$(date +%Y%m%d_%H%M%S).log"

# Create logs directory
mkdir -p "$LOG_DIR"

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
║            🐳 Universal Launcher v2.0                     ║
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

check_ports() {
    log_step "Checking if ports are available..."
    
    local ports=(5173 3000 3001)  # Vite, alternative ports
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Port $port is already in use"
            
            if [ "$ENVIRONMENT" = "local" ]; then
                log_info "Would you like to kill process on port $port?"
                read -p "$(echo -e ${YELLOW}Kill process on port $port? [y/N]:${NC} )" -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    kill -9 $(lsof -t -i:$port) 2>/dev/null || true
                    sleep 1
                    log_success "Port $port is now available"
                else
                    log_info "Will try alternative port"
                fi
            else
                log_info "Docker environment - skipping port kill"
            fi
        else
            log_success "Port $port is available"
        fi
    done
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
    log_step "Starting development server..."
    
    cd "$PROJECT_DIR"
    
    # Create dev log file
    DEV_LOG="$LOG_DIR/dev_$(date +%Y%m%d_%H%M%S).log"
    
    log_info "Environment: $ENVIRONMENT"
    log_info "Project Directory: $PROJECT_DIR"
    log_info "Starting Electron + Vite..."
    log_info "Development logs: $DEV_LOG"
    log_info "Launcher logs: $LOG_FILE"
    
    # Set Electron flags based on environment
    if [ "$ENVIRONMENT" = "docker" ]; then
        export ELECTRON_DISABLE_SECURITY_WARNINGS=true
        log_info "Running in Docker mode with Xvfb"
        
        # Start with Xvfb if available
        if command -v xvfb-run > /dev/null; then
            log_info "Starting with xvfb-run..."
            echo ""
            xvfb-run -a --server-args="-screen 0 1024x768x24" yarn dev 2>&1 | tee -a "$DEV_LOG"
        else
            log_warning "xvfb-run not available, trying direct start..."
            echo ""
            yarn dev 2>&1 | tee -a "$DEV_LOG"
        fi
    else
        # Local development
        echo ""
        log_success "🎉 Starting ChimeraAI in Local Mode..."
        echo ""
        yarn dev 2>&1 | tee -a "$DEV_LOG"
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
    
    # Skip checks if requested
    if [ $SKIP_CHECKS -eq 0 ]; then
        # Check prerequisites
        check_node
        check_yarn
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
        
        # Check ports (only in local mode)
        if [ "$ENVIRONMENT" = "local" ]; then
            check_ports
        fi
        
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
    
    # Kill background processes in Docker
    if [ "$ENVIRONMENT" = "docker" ]; then
        pkill -f Xvfb 2>/dev/null || true
    fi
    
    log_info "Development server stopped"
    exit 0
}

# Run main function
main "$@"