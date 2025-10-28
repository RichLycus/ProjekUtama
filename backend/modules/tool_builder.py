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
        
        External dependencies (loaded from parent):
        - react, react-dom, lucide-react, framer-motion
        """
        try:
            output_file = output_dir / "bundle.js"
            
            # esbuild command with externals
            cmd = [
                "npx", "esbuild",
                str(input_file),
                "--bundle",
                "--format=iife",
                "--global-name=ToolComponent",
                f"--outfile={output_file}",
                "--external:react",
                "--external:react-dom",
                "--external:lucide-react",
                "--external:framer-motion",
                "--jsx=automatic",
                "--loader:.tsx=tsx",
                "--loader:.ts=ts",
                "--loader:.jsx=jsx",
                "--loader:.js=js",
                "--minify"
            ]
            
            logger.info(f"Running esbuild: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
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
                "error": "Build timeout (30s exceeded)"
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
        
        HTML includes:
        1. Link to LOCAL Tailwind CSS (fully offline!)
        2. Script to access parent context (__APP_CTX__)
        3. Tool bundle script
        4. Initialization code
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
    
    <script>
        // Access parent app context
        const parentContext = window.parent.__APP_CTX__;
        
        if (!parentContext) {{
            console.error('Parent context not available! Tool cannot load.');
            document.getElementById('tool-root').innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <h2 style="color: red;">Error: Parent Context Not Available</h2>
                    <p>The tool cannot access shared dependencies from the parent app.</p>
                </div>
            `;
        }} else {{
            console.log('✅ Parent context loaded:', Object.keys(parentContext));
            
            // Make parent dependencies global for bundle
            window.React = parentContext.React;
            window.ReactDOM = parentContext.ReactDOM;
            window.LucideReact = parentContext.LucideReact;
            window.motion = parentContext.motion;
            window.AnimatePresence = parentContext.AnimatePresence;
            
            // Load tool bundle
            const script = document.createElement('script');
            script.src = '/tools/{slug}/bundle.js';
            script.onload = () => {{
                console.log('✅ Tool bundle loaded');
                
                // Notify parent that tool is ready
                window.parent.postMessage({{
                    type: 'tool:ready',
                    source: 'tool'
                }}, '*');
                
                // Listen for messages from parent
                window.addEventListener('message', (event) => {{
                    if (event.data.type === 'init') {{
                        console.log('📥 Init data from parent:', event.data.payload);
                        // Tool can access event.data.payload for initialization
                    }}
                }});
            }};
            script.onerror = () => {{
                console.error('❌ Failed to load tool bundle');
                window.parent.postMessage({{
                    type: 'tool:error',
                    payload: {{ message: 'Failed to load tool bundle' }},
                    source: 'tool'
                }}, '*');
            }};
            document.body.appendChild(script);
        }}
    </script>
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
