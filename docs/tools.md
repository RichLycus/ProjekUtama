# Python Tools Directory

This directory will contain Python automation tools that can be executed from the Electron app.

## Structure (Phase 2)

Each tool will have its own directory:

```
tools/
├── tool1/
│   ├── tool1.py          # Main Python script
│   ├── requirements.txt  # Dependencies
│   └── build/           # PyInstaller output (executable)
├── tool2/
│   ├── tool2.py
│   └── ...
```

## Tool Examples (Upcoming)

1. **Image Converter** - Batch convert images between formats
2. **File Organizer** - Automatically organize files by type/date
3. **PDF Merger** - Merge multiple PDFs into one
4. **Data Processor** - CSV/JSON data transformation
5. **Custom Scripts** - User-defined automation scripts

## Communication Flow

1. User selects tool from Tools page
2. Frontend sends IPC message: `python-tool:run`
3. Main process executes tool via `child_process`
4. Tool sends progress via stdout
5. Main process forwards to renderer: `python-tool:status`
6. UI updates in real-time

## Status

**Phase 0**: Directory structure ready ✅  
**Phase 2**: Implementation planned 🔜
