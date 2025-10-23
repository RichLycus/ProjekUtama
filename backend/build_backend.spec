# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for ChimeraAI Backend
Builds FastAPI backend into standalone executable
"""

from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import os
from pathlib import Path

# Get backend directory
backend_dir = Path(SPECPATH)

# Collect all FastAPI and uvicorn dependencies
hiddenimports = [
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
    'fastapi',
    'starlette',
    'pydantic',
    'motor',
    'pymongo',
]

# Collect all submodules
hiddenimports += collect_submodules('uvicorn')
hiddenimports += collect_submodules('fastapi')
hiddenimports += collect_submodules('starlette')
hiddenimports += collect_submodules('pydantic')
hiddenimports += collect_submodules('motor')

# Add ChromaDB and AI-related modules carefully
try:
    hiddenimports += collect_submodules('chromadb')
    hiddenimports += collect_submodules('chromadb.api')
    hiddenimports += collect_submodules('chromadb.db')
    hiddenimports += collect_submodules('chromadb.utils')
except Exception:
    pass

try:
    hiddenimports += collect_submodules('sentence_transformers')
except Exception:
    pass

try:
    hiddenimports += collect_submodules('torch')
except Exception:
    pass

# Collect data files
datas = []
datas += collect_data_files('uvicorn')
datas += collect_data_files('fastapi')
datas += collect_data_files('starlette')

# Try to collect AI/ML data files
try:
    datas += collect_data_files('chromadb')
except Exception:
    pass

try:
    datas += collect_data_files('sentence_transformers')
except Exception:
    pass

try:
    datas += collect_data_files('transformers')
except Exception:
    pass

try:
    datas += collect_data_files('torch')
except Exception:
    pass

# Add backend modules
datas += [
    (str(backend_dir / 'modules'), 'modules'),
    (str(backend_dir / 'routes'), 'routes'),
    (str(backend_dir / 'ai'), 'ai'),
    (str(backend_dir / 'utils'), 'utils'),
    (str(backend_dir / 'database.py'), '.'),
]

# Add sample tools if exists
if (backend_dir / 'sample_tools').exists():
    datas += [(str(backend_dir / 'sample_tools'), 'sample_tools')]
if (backend_dir / 'sample_tools_v2').exists():
    datas += [(str(backend_dir / 'sample_tools_v2'), 'sample_tools_v2')]

block_cipher = None

a = Analysis(
    ['server.py'],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib',
        'tkinter',
        'PyQt5',
        'PyQt6',
        'PySide2',
        'PySide6',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

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
    console=True,  # Keep console for logs
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='chimera-backend',
)
