# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for ChimeraAI Backend
# Build standalone backend executable with all dependencies

import sys
import os
from pathlib import Path

# Get backend directory
backend_dir = Path('.')
project_root = backend_dir.parent

# Data files to include
datas = [
    # Database file
    ('data/chimera_tools.db', 'data'),
    
    # Characters and configurations
    ('characters', 'characters'),
    ('data/ai_config.json', 'data'),
    ('data/vector_db', 'data/vector_db'),
    
    # Sample tools (optional)
    ('tools', 'tools'),
    
    # Public directory - CRITICAL for StaticFiles
    # This is where built frontend tools are served from
    (str(project_root / 'public'), 'public'),
]

# Hidden imports (modules that PyInstaller might miss)
hiddenimports = [
    # FastAPI and dependencies
    'fastapi',
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    
    # Starlette
    'starlette',
    'starlette.applications',
    'starlette.middleware',
    'starlette.middleware.cors',
    'starlette.responses',
    'starlette.routing',
    'starlette.staticfiles',
    
    # Pydantic
    'pydantic',
    'pydantic.fields',
    'pydantic.main',
    'pydantic_core',
    
    # Database
    'pymongo',
    'motor',
    'sqlite3',
    
    # AI/ML dependencies
    'chromadb',
    'chromadb.api',
    'chromadb.config',
    'chromadb.telemetry',
    'chromadb.telemetry.product',
    'chromadb.telemetry.product.posthog',
    'chromadb.telemetry.opentelemetry',
    'chromadb.telemetry.opentelemetry.grpc',
    'sentence_transformers',
    'torch',
    'transformers',
    'numpy',
    'scipy',
    'sklearn',
    
    # Other dependencies
    'yaml',
    '_yaml',
    'dotenv',
    'passlib',
    'jose',
    'cryptography',
    
    # Fix for jaraco.text error (pkg_resources dependencies)
    'jaraco',
    'jaraco.text',
    'jaraco.functools',
    'jaraco.context',
    'pkg_resources',
]

# Exclude unnecessary packages to reduce size
excludes = [
    'matplotlib',
    'tkinter',
    'PyQt5',
    'PyQt6',
    'PySide2',
    'PySide6',
    'test',
    'tests',
    'setuptools',
]

a = Analysis(
    ['server.py'],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='chimera-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # Keep console for debugging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='chimera-backend',
)

# Post-build: Move to project dist/backend/ for clean structure
# This will be handled by build scripts
