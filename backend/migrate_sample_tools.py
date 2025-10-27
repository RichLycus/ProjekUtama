"""
Migrate Sample Tools to Organized Folder Structure

This script will:
1. Backup current flat structure
2. Reorganize tools into category/tool-name/backend|frontend structure
3. Validate Python syntax (backend)
4. Validate HTML/TSX syntax (frontend)
5. Detect single vs dual tools
6. Generate migration report

Usage:
    python migrate_sample_tools.py [--dry-run] [--no-backup]
"""

import sys
import os
import re
import shutil
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import ast
import subprocess

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

class ToolMigrator:
    def __init__(self, dry_run: bool = False, no_backup: bool = False):
        self.backend_dir = backend_dir
        self.sample_tools_dir = backend_dir / "sample_tools"
        self.backup_dir = backend_dir / "sample_tools_backup"
        self.dry_run = dry_run
        self.no_backup = no_backup
        
        # Tool mapping: {backend_file: {category, slug, frontend_file}}
        self.tool_mapping = {
            "calculator_backend.py": {
                "category": "utilities",
                "slug": "calculator",
                "frontend": "calculator_frontend.html",
                "name": "Simple Calculator"
            },
            "advanced_calculator_backend.py": {
                "category": "utilities", 
                "slug": "advanced-calculator",
                "frontend": "advanced_calculator_frontend.html",
                "name": "Advanced Calculator"
            },
            "text_formatter_backend.py": {
                "category": "office",
                "slug": "text-formatter",
                "frontend": "text_formatter_frontend.html",
                "name": "Text Formatter"
            },
            "color_picker_backend.py": {
                "category": "devtools",
                "slug": "color-picker",
                "frontend": "color_picker_frontend.html",
                "name": "Color Picker"
            },
            "greeting_speaker.py": {
                "category": "devtools",
                "slug": "greeting-speaker",
                "frontend": "greeting_speaker.tsx",
                "name": "Greeting Speaker"
            },
            "image_upscaler.py": {
                "category": "multimedia",
                "slug": "image-upscaler",
                "frontend": "image_upscaler.tsx",
                "name": "Image Upscaler"
            },
            "example_csv_to_json.py": {
                "category": "converters",
                "slug": "csv-to-json",
                "frontend": None,  # Single tool (backend only)
                "name": "CSV to JSON Converter"
            },
            "example_json_formatter.py": {
                "category": "converters",
                "slug": "json-formatter",
                "frontend": None,  # Single tool (backend only)
                "name": "JSON Formatter"
            },
            "example_text_counter.py": {
                "category": "utilities",
                "slug": "text-counter",
                "frontend": None,  # Single tool (backend only)
                "name": "Text Counter"
            }
        }
        
        self.results = {
            "success": [],
            "failed": [],
            "warnings": []
        }
    
    def validate_python_syntax(self, file_path: Path) -> Tuple[bool, Optional[str]]:
        """Validate Python file syntax"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                code = f.read()
            
            # Try to parse as AST
            ast.parse(code)
            
            # Additional check: compile the code
            compile(code, str(file_path), 'exec')
            
            return True, None
        except SyntaxError as e:
            return False, f"Syntax error at line {e.lineno}: {e.msg}"
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    def validate_html_syntax(self, file_path: Path) -> Tuple[bool, Optional[str]]:
        """Basic validation for HTML files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for basic HTML structure
            if not re.search(r'<html|<!DOCTYPE', content, re.IGNORECASE):
                return False, "Missing HTML doctype or html tag"
            
            # Check for unclosed tags (basic)
            open_tags = re.findall(r'<(\w+)[^>]*>', content)
            close_tags = re.findall(r'</(\w+)>', content)
            
            # Check balanced tags (ignore self-closing)
            self_closing = {'img', 'br', 'hr', 'input', 'meta', 'link'}
            open_tags = [t for t in open_tags if t not in self_closing]
            
            if len(open_tags) != len(close_tags):
                return False, f"Unbalanced tags: {len(open_tags)} open, {len(close_tags)} close"
            
            return True, None
        except Exception as e:
            return False, f"Error reading file: {str(e)}"
    
    def validate_tsx_syntax(self, file_path: Path) -> Tuple[bool, Optional[str]]:
        """Basic validation for TSX/JSX files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for React imports
            if 'import React' not in content and "import { " not in content:
                return False, "Missing React imports"
            
            # Check for export
            if 'export default' not in content and 'export const' not in content:
                return False, "Missing export statement"
            
            # Check for basic JSX structure
            if '<' not in content or '>' not in content:
                return False, "Missing JSX elements"
            
            return True, None
        except Exception as e:
            return False, f"Error reading file: {str(e)}"
    
    def validate_file(self, file_path: Path, file_type: str) -> Tuple[bool, Optional[str]]:
        """Validate file based on type"""
        if not file_path.exists():
            return False, "File not found"
        
        if file_type == "backend":
            return self.validate_python_syntax(file_path)
        elif file_path.suffix in ['.html']:
            return self.validate_html_syntax(file_path)
        elif file_path.suffix in ['.tsx', '.jsx']:
            return self.validate_tsx_syntax(file_path)
        else:
            return True, "Unknown file type, skipped validation"
    
    def backup_current_structure(self):
        """Backup current flat structure"""
        if self.no_backup:
            print("⏭️  Skipping backup (--no-backup flag)")
            return
        
        if self.backup_dir.exists():
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            old_backup = self.backup_dir.parent / f"sample_tools_backup_{timestamp}"
            print(f"📦 Existing backup found, moving to {old_backup.name}")
            shutil.move(str(self.backup_dir), str(old_backup))
        
        print(f"💾 Creating backup at {self.backup_dir}")
        if not self.dry_run:
            shutil.copytree(self.sample_tools_dir, self.backup_dir)
        print("✅ Backup complete!")
    
    def create_new_structure(self):
        """Create new organized folder structure"""
        print("\n🏗️  Creating new folder structure...")
        
        for backend_file, config in self.tool_mapping.items():
            category = config['category']
            slug = config['slug']
            frontend_file = config['frontend']
            tool_name = config['name']
            
            # Source files
            backend_src = self.sample_tools_dir / backend_file
            
            # Destination paths
            tool_dir = self.sample_tools_dir / category / slug
            backend_dir = tool_dir / "backend"
            frontend_dir = tool_dir / "frontend"
            
            print(f"\n📁 Processing: {tool_name} ({category}/{slug})")
            
            # Validate backend
            if backend_src.exists():
                is_valid, error = self.validate_file(backend_src, "backend")
                if is_valid:
                    print(f"  ✅ Backend validation passed")
                else:
                    print(f"  ⚠️  Backend validation failed: {error}")
                    self.results['warnings'].append({
                        'tool': tool_name,
                        'file': backend_file,
                        'issue': error
                    })
            else:
                print(f"  ❌ Backend file not found: {backend_file}")
                self.results['failed'].append({
                    'tool': tool_name,
                    'reason': f"Backend file not found: {backend_file}"
                })
                continue
            
            # Create directories
            if not self.dry_run:
                backend_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy backend file
            backend_dest = backend_dir / "main.py"
            if not self.dry_run:
                shutil.copy2(backend_src, backend_dest)
            print(f"  📄 Backend: {backend_file} → {category}/{slug}/backend/main.py")
            
            # Handle frontend (if dual tool)
            if frontend_file:
                frontend_src = self.sample_tools_dir / frontend_file
                
                if frontend_src.exists():
                    # Validate frontend
                    is_valid, error = self.validate_file(frontend_src, "frontend")
                    if is_valid:
                        print(f"  ✅ Frontend validation passed")
                    else:
                        print(f"  ⚠️  Frontend validation failed: {error}")
                        self.results['warnings'].append({
                            'tool': tool_name,
                            'file': frontend_file,
                            'issue': error
                        })
                    
                    # Create frontend directory
                    if not self.dry_run:
                        frontend_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Get proper frontend name (PascalCase component name)
                    frontend_ext = frontend_src.suffix
                    component_name = ''.join(word.capitalize() for word in slug.split('-'))
                    frontend_dest = frontend_dir / f"{component_name}{frontend_ext}"
                    
                    if not self.dry_run:
                        shutil.copy2(frontend_src, frontend_dest)
                    print(f"  📄 Frontend: {frontend_file} → {category}/{slug}/frontend/{component_name}{frontend_ext}")
                    
                    tool_type = "dual"
                else:
                    print(f"  ⚠️  Frontend file not found: {frontend_file}")
                    self.results['warnings'].append({
                        'tool': tool_name,
                        'file': frontend_file,
                        'issue': "Frontend file not found"
                    })
                    tool_type = "single (backend only)"
            else:
                tool_type = "single (backend only)"
                print(f"  📄 Single tool (backend only)")
            
            self.results['success'].append({
                'tool': tool_name,
                'category': category,
                'slug': slug,
                'type': tool_type
            })
        
        print("\n✅ Folder structure creation complete!")
    
    def cleanup_old_files(self):
        """Remove old flat files"""
        print("\n🧹 Cleaning up old flat files...")
        
        if self.dry_run:
            print("  (Dry run - no files deleted)")
            return
        
        # Remove old backend files
        for backend_file in self.tool_mapping.keys():
            old_file = self.sample_tools_dir / backend_file
            if old_file.exists():
                old_file.unlink()
                print(f"  🗑️  Removed: {backend_file}")
        
        # Remove old frontend files
        for config in self.tool_mapping.values():
            if config['frontend']:
                old_file = self.sample_tools_dir / config['frontend']
                if old_file.exists():
                    old_file.unlink()
                    print(f"  🗑️  Removed: {config['frontend']}")
        
        print("✅ Cleanup complete!")
    
    def generate_report(self):
        """Generate migration report"""
        print("\n" + "="*60)
        print("📊 MIGRATION REPORT")
        print("="*60)
        
        print(f"\n✅ Successfully migrated: {len(self.results['success'])} tools")
        for item in self.results['success']:
            print(f"  • {item['tool']} ({item['type']})")
            print(f"    → {item['category']}/{item['slug']}/")
        
        if self.results['warnings']:
            print(f"\n⚠️  Warnings: {len(self.results['warnings'])}")
            for item in self.results['warnings']:
                print(f"  • {item['tool']}: {item['file']}")
                print(f"    → {item['issue']}")
        
        if self.results['failed']:
            print(f"\n❌ Failed: {len(self.results['failed'])}")
            for item in self.results['failed']:
                print(f"  • {item['tool']}: {item['reason']}")
        
        # Save report to JSON
        report_file = self.backend_dir / "migration_report.json"
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "dry_run": self.dry_run,
            "results": self.results
        }
        
        if not self.dry_run:
            with open(report_file, 'w') as f:
                json.dump(report_data, f, indent=2)
            print(f"\n📝 Report saved to: {report_file}")
        
        print("\n" + "="*60)
    
    def run(self):
        """Run migration"""
        print("🚀 Starting Sample Tools Migration")
        print(f"   Source: {self.sample_tools_dir}")
        print(f"   Dry run: {self.dry_run}")
        print(f"   Backup: {not self.no_backup}")
        print()
        
        # Step 1: Backup
        self.backup_current_structure()
        
        # Step 2: Create new structure
        self.create_new_structure()
        
        # Step 3: Cleanup
        self.cleanup_old_files()
        
        # Step 4: Generate report
        self.generate_report()
        
        print("\n🎉 Migration complete!")
        if self.dry_run:
            print("   (This was a dry run - no changes were made)")
        print(f"\n💡 Next steps:")
        print(f"   1. Review migration report")
        print(f"   2. Test tools with: python reset_and_load_samples.py")
        print(f"   3. If issues found, restore from: {self.backup_dir}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrate sample tools to organized structure")
    parser.add_argument("--dry-run", action="store_true", help="Simulate migration without making changes")
    parser.add_argument("--no-backup", action="store_true", help="Skip backup creation")
    
    args = parser.parse_args()
    
    migrator = ToolMigrator(dry_run=args.dry_run, no_backup=args.no_backup)
    migrator.run()
