"""
Tool Builder Module

Auto-builds uploaded tool components using Node.js bundler.
Generates standalone bundles with shared dependencies (external).

Architecture:
1. Read Component.tsx from tools/{category}/{slug}/frontend/
2. Build with esbuild (mark React, ReactDOM, lucide-react as external)
3. Generate bundle.js + index.html
4. Save to public/tools/{slug}/

Dependencies marked as external (loaded from parent):
- react
- react-dom
- lucide-react
- framer-motion
"""

import os
import json
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class ToolBuilder:
    """Build uploaded tool components with esbuild"""
    
    def __init__(self, backend_dir: Path):
        self.backend_dir = backend_dir
        self.public_dir = backend_dir.parent / "public" / "tools"
        self.public_dir.mkdir(parents=True, exist_ok=True)
        
    def build_tool(self, tool_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build a tool component into standalone bundle
        
        Args:
            tool_data: Tool metadata (must have frontend_path)
            
        Returns:
            dict: Build result with success status and output paths
        """
        try:
            tool_name = tool_data.get("name", "Unknown")
            frontend_path = tool_data.get("frontend_path")
            
            if not frontend_path:
                raise ValueError("Tool has no frontend_path")
            
            # Get absolute path to component
            component_file = self.backend_dir / frontend_path
            
            if not component_file.exists():
                raise FileNotFoundError(f"Component file not found: {component_file}")
            
            # Generate slug for output directory
            slug = tool_data.get("_id", tool_name.lower().replace(" ", "-"))
            output_dir = self.public_dir / slug
            output_dir.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"🔨 Building tool: {tool_name}")
            logger.info(f"   Input: {component_file}")
            logger.info(f"   Output: {output_dir}")
            
            # Build with esbuild via npx
            bundle_result = self._build_with_esbuild(
                component_file,
                output_dir,
                slug
            )
            
            if not bundle_result["success"]:
                raise Exception(f"Build failed: {bundle_result.get('error')}")
            
            # Generate index.html for iframe
            html_result = self._generate_index_html(
                output_dir,
                slug,
                tool_name
            )
            
            if not html_result["success"]:
                raise Exception(f"HTML generation failed: {html_result.get('error')}")
            
            logger.info(f"✅ Tool built successfully: {tool_name}")
            logger.info(f"   Bundle: {output_dir / 'bundle.js'}")
            logger.info(f"   HTML: {output_dir / 'index.html'}")
            
            return {
                "success": True,
                "slug": slug,
                "output_dir": str(output_dir),
                "bundle_path": str(output_dir / "bundle.js"),
                "html_path": str(output_dir / "index.html"),
                "url": f"/tools/{slug}/index.html"
            }
            
        except Exception as e:
            logger.error(f"❌ Tool build failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _build_with_esbuild(
        self, 
        input_file: Path, 
        output_dir: Path,
        slug: str
    ) -> Dict[str, Any]:
        """
        Build component with esbuild
        
        Strategy: Create wrapper file that imports React and exports everything globally
        Then bundle the wrapper - this makes React available in the bundle
        """
        try:
            output_file = output_dir / "bundle.js"
            
            # Create a wrapper file that imports everything and exposes globally
            wrapper_file = output_dir / "_wrapper.jsx"
            wrapper_content = f"""
// Wrapper to bundle React + Component together
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';

// Import the actual component
import Component from '{input_file.as_posix()}';

// Create a global object with everything needed
const ToolBundle = {{
    React: React,
    ReactDOM: ReactDOMClient,
    Component: Component
}};

// Export for IIFE
export default ToolBundle;

// Also expose to window immediately
if (typeof window !== 'undefined') {{
    window.React = React;
    window.ReactDOM = ReactDOMClient;
    window.ToolBundle = ToolBundle;
}}
"""
            
            with open(wrapper_file, 'w') as f:
                f.write(wrapper_content)
            
            # Footer script to auto-render using the bundled React
            footer_js = """
// Auto-render using bundled React
(function() {
    // Track if already initialized to prevent double render
    if (window.__TOOL_INITIALIZED__) {
        return;
    }
    
    function initTool() {
        const rootEl = document.getElementById('tool-root');
        if (!rootEl) {
            console.error('❌ Root element #tool-root not found');
            return;
        }
        
        try {
            // Access from ToolComponent (the IIFE export)
            const bundle = ToolComponent.default || ToolComponent;
            
            if (!bundle || !bundle.React || !bundle.ReactDOM || !bundle.Component) {
                throw new Error('Bundle incomplete: ' + JSON.stringify(Object.keys(bundle || {})));
            }
            
            const { React, ReactDOM, Component } = bundle;
            
            // Render
            const root = ReactDOM.createRoot(rootEl);
            root.render(React.createElement(Component));
            
            // Mark as initialized
            window.__TOOL_INITIALIZED__ = true;
            console.log('✅ Tool rendered successfully');
            
        } catch (error) {
            console.error('❌ Render error:', error);
            rootEl.innerHTML = `
                <div style="padding:2rem;text-align:center;color:#ef4444;">
                    <strong>Error:</strong> ${error.message}
                    <br><small>Check console for details</small>
                </div>
            `;
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTool);
    } else {
        initTool();
    }
})();
""".strip()
            
            # esbuild command - Bundle the wrapper (which includes React + Component)
            cmd = [
                "npx", "esbuild",
                str(wrapper_file),
                "--bundle",
                "--format=iife",
                "--global-name=ToolComponent",
                f"--outfile={output_file}",
                "--jsx=automatic",
                "--loader:.tsx=tsx",
                "--loader:.ts=ts",
                "--loader:.jsx=jsx",
                "--loader:.js=js",
                "--minify",
                "--platform=browser",
                f"--footer:js={footer_js}",
                # Bundle everything including React (no externals)
            ]
            
            logger.info(f"Running esbuild: {' '.join(cmd[:15])}...")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            # Clean up wrapper file
            if wrapper_file.exists():
                wrapper_file.unlink()
            
            if result.returncode != 0:
                raise Exception(f"esbuild failed: {result.stderr}")
            
            logger.info(f"✅ Bundle created: {output_file}")
            
            return {
                "success": True,
                "output": str(output_file),
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Build timeout (60s exceeded)"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_index_html(
        self,
        output_dir: Path,
        slug: str,
        tool_name: str
    ) -> Dict[str, Any]:
        """
        Generate index.html for iframe loading
        
        NEW ARCHITECTURE (Self-Contained):
        - NO CDN dependencies (React bundled inside)
        - Local Tailwind CSS only
        - Single bundle.js with everything
        - Fully offline-capable
        - CSP-compliant (no external scripts)
        """
        try:
            html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{tool_name}</title>
    
    <!-- Load local Tailwind CSS (offline-friendly) -->
    <link rel="stylesheet" href="/api/tools/styles.css">
    
    <style>
        body {{
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }}
        #tool-root {{
            min-height: 100vh;
            padding: 1rem;
        }}
    </style>
</head>
<body class="bg-white dark:bg-dark-background">
    <div id="tool-root"></div>
    
    <!-- 
        Self-contained bundle:
        - React + ReactDOM bundled inside
        - Component code included
        - Auto-renders via footer script
        - No external dependencies
        - CSP-compliant
    -->
    <script src="/tools/{slug}/bundle.js"></script>
</body>
</html>"""
            
            html_file = output_dir / "index.html"
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            logger.info(f"✅ HTML generated: {html_file}")
            
            return {
                "success": True,
                "output": str(html_file)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def clean_build(self, slug: str) -> bool:
        """Remove build output for a tool"""
        try:
            output_dir = self.public_dir / slug
            if output_dir.exists():
                import shutil
                shutil.rmtree(output_dir)
                logger.info(f"🗑️ Cleaned build for: {slug}")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Failed to clean build: {str(e)}")
            return False
