"""
Frontend Tool Validator
Validates React/JavaScript mini-apps for ChimeraAI
"""

import re
import json
from typing import Dict, Any, List
from pathlib import Path


class FrontendToolValidator:
    """Validator for frontend tools (React components, HTML/JS apps)"""
    
    def validate(self, file_path: str, content: str, file_ext: str) -> Dict[str, Any]:
        """
        Validate a frontend tool file
        
        Args:
            file_path: Path to the file
            content: File content as string
            file_ext: File extension (.jsx, .tsx, .html, .js)
        
        Returns:
            Dict with validation results
        """
        errors = []
        warnings = []
        dependencies = []
        
        try:
            # Validate based on file type
            if file_ext in ['.jsx', '.tsx', '.js']:
                result = self._validate_react_component(content, file_ext)
            elif file_ext == '.html':
                result = self._validate_html_app(content)
            else:
                return {
                    "valid": False,
                    "errors": [f"Unsupported file type: {file_ext}. Only .jsx, .tsx, .js, .html are supported"],
                    "warnings": [],
                    "dependencies": []
                }
            
            errors.extend(result.get('errors', []))
            warnings.extend(result.get('warnings', []))
            dependencies.extend(result.get('dependencies', []))
            
            # Check for metadata
            metadata_result = self._extract_metadata(content)
            if not metadata_result['found']:
                warnings.append("No metadata found in file. Consider adding metadata comments.")
            
            return {
                "valid": len(errors) == 0,
                "errors": errors,
                "warnings": warnings,
                "dependencies": dependencies,
                "metadata": metadata_result.get('data', {})
            }
            
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Validation error: {str(e)}"],
                "warnings": warnings,
                "dependencies": dependencies
            }
    
    def _validate_react_component(self, content: str, file_ext: str) -> Dict[str, Any]:
        """Validate React component"""
        errors = []
        warnings = []
        dependencies = []
        
        # Check for React import
        if 'import' in content and 'react' in content.lower():
            dependencies.append('react')
        
        # Check for component export
        has_export = bool(re.search(r'export\s+(default\s+)?function|export\s+(default\s+)?const', content))
        if not has_export:
            warnings.append("No export found. Component should export a function or const.")
        
        # Check for JSX syntax
        has_jsx = bool(re.search(r'return\s*\(?\s*<', content))
        if not has_jsx and file_ext in ['.jsx', '.tsx']:
            warnings.append("No JSX syntax found. Are you sure this is a React component?")
        
        # Extract dependencies from imports
        import_matches = re.findall(r'import\s+.+\s+from\s+[\'"](.+?)[\'"]', content)
        for imp in import_matches:
            if not imp.startswith('./') and not imp.startswith('../') and not imp.startswith('@/'):
                if imp not in dependencies:
                    dependencies.append(imp)
        
        # TypeScript specific checks
        if file_ext == '.tsx':
            if 'interface' not in content and 'type' not in content:
                warnings.append("Consider adding TypeScript types for better type safety")
        
        return {
            "errors": errors,
            "warnings": warnings,
            "dependencies": dependencies
        }
    
    def _validate_html_app(self, content: str) -> Dict[str, Any]:
        """Validate standalone HTML app"""
        errors = []
        warnings = []
        dependencies = []
        
        # Check for basic HTML structure
        if '<html' not in content.lower():
            warnings.append("No <html> tag found. Consider using full HTML structure.")
        
        if '<body' not in content.lower():
            warnings.append("No <body> tag found.")
        
        # Check for script tags
        has_script = '<script' in content.lower()
        if not has_script:
            warnings.append("No <script> tag found. This might be a static HTML file.")
        
        # Extract external dependencies
        # Check for CDN links
        cdn_matches = re.findall(r'src=["\']https?://[^"\']+["\']', content)
        if cdn_matches:
            warnings.append(f"Found {len(cdn_matches)} external CDN dependencies")
        
        return {
            "errors": errors,
            "warnings": warnings,
            "dependencies": dependencies
        }
    
    def _extract_metadata(self, content: str) -> Dict[str, Any]:
        """Extract metadata from comments"""
        metadata = {}
        
        # Try to extract from comment block
        # Format:
        # /**
        #  * TOOL: Tool Name
        #  * DESCRIPTION: Tool description
        #  * AUTHOR: Author name
        #  * VERSION: 1.0.0
        #  */
        
        comment_match = re.search(r'/\*\*([\s\S]*?)\*/', content)
        if comment_match:
            comment_block = comment_match.group(1)
            
            # Extract fields
            tool_match = re.search(r'\*\s*TOOL:\s*(.+)', comment_block, re.I)
            desc_match = re.search(r'\*\s*DESCRIPTION:\s*(.+)', comment_block, re.I)
            author_match = re.search(r'\*\s*AUTHOR:\s*(.+)', comment_block, re.I)
            version_match = re.search(r'\*\s*VERSION:\s*(.+)', comment_block, re.I)
            
            if tool_match:
                metadata['tool'] = tool_match.group(1).strip()
            if desc_match:
                metadata['description'] = desc_match.group(1).strip()
            if author_match:
                metadata['author'] = author_match.group(1).strip()
            if version_match:
                metadata['version'] = version_match.group(1).strip()
            
            return {
                "found": len(metadata) > 0,
                "data": metadata
            }
        
        return {
            "found": False,
            "data": {}
        }
