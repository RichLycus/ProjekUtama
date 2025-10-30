"""
Badge System for ChimeraAI Tools
Auto-detect badges based on dependencies, file types, and categories
"""

from typing import List, Dict, Set
from pathlib import Path


class BadgeDetector:
    """Detect and generate badges for tools"""
    
    # Badge color mapping
    BADGE_COLORS = {
        # Languages
        "Python": "#3776AB",
        "TypeScript": "#3178C6",
        "JavaScript": "#F7DF1E",
        "React": "#61DAFB",
        
        # Categories
        "AI/ML": "#FF6B6B",
        "Data": "#4ECDC4",
        "DevTools": "#95E1D3",
        "Multimedia": "#A8E6CF",
        "Utilities": "#FFD93D",
        "Web": "#6C5CE7",
        
        # Frameworks/Libraries
        "FastAPI": "#009688",
        "Flask": "#000000",
        "Express": "#000000",
        "Vue": "#42B883",
        "Angular": "#DD0031",
        "Svelte": "#FF3E00",
        
        # Frontend Libraries
        "Tailwind": "#38B2AC",
        "Bootstrap": "#7952B3",
        "Material-UI": "#0081CB",
        "Ant Design": "#0170FE",
        "Chakra UI": "#319795",
        
        # AI/ML
        "PyTorch": "#EE4C2C",
        "TensorFlow": "#FF6F00",
        "Transformers": "#FFD93D",
        "LangChain": "#1C3FAA",
        "OpenAI": "#412991",
        
        # Data Processing
        "Pandas": "#150458",
        "NumPy": "#013243",
        "Scikit-learn": "#F7931E",
        
        # Animation/UI
        "Framer Motion": "#0055FF",
        "GSAP": "#88CE02",
        "Three.js": "#000000",
        
        # Icons
        "Lucide": "#F56565",
        "Font Awesome": "#339AF0",
        "Heroicons": "#8B5CF6",
        
        # HTTP/API
        "Axios": "#5A29E4",
        "Fetch API": "#005F73",
        
        # Default
        "Tool": "#718096"
    }
    
    def __init__(self):
        pass
    
    def detect_from_dependencies(
        self,
        python_deps: List[str],
        node_deps: List[str]
    ) -> List[Dict[str, str]]:
        """Detect badges from dependencies"""
        badges = []
        detected = set()
        
        # Python dependencies
        for dep in python_deps:
            dep_lower = dep.lower()
            
            if 'torch' in dep_lower and 'PyTorch' not in detected:
                badges.append({"name": "PyTorch", "color": self.BADGE_COLORS["PyTorch"]})
                detected.add('PyTorch')
            elif 'tensorflow' in dep_lower and 'TensorFlow' not in detected:
                badges.append({"name": "TensorFlow", "color": self.BADGE_COLORS["TensorFlow"]})
                detected.add('TensorFlow')
            elif 'transformers' in dep_lower and 'Transformers' not in detected:
                badges.append({"name": "Transformers", "color": self.BADGE_COLORS["Transformers"]})
                detected.add('Transformers')
            elif 'langchain' in dep_lower and 'LangChain' not in detected:
                badges.append({"name": "LangChain", "color": self.BADGE_COLORS["LangChain"]})
                detected.add('LangChain')
            elif 'openai' in dep_lower and 'OpenAI' not in detected:
                badges.append({"name": "OpenAI", "color": self.BADGE_COLORS["OpenAI"]})
                detected.add('OpenAI')
            elif 'pandas' in dep_lower and 'Pandas' not in detected:
                badges.append({"name": "Pandas", "color": self.BADGE_COLORS["Pandas"]})
                detected.add('Pandas')
            elif 'numpy' in dep_lower and 'NumPy' not in detected:
                badges.append({"name": "NumPy", "color": self.BADGE_COLORS["NumPy"]})
                detected.add('NumPy')
            elif 'sklearn' in dep_lower or 'scikit-learn' in dep_lower:
                if 'Scikit-learn' not in detected:
                    badges.append({"name": "Scikit-learn", "color": self.BADGE_COLORS["Scikit-learn"]})
                    detected.add('Scikit-learn')
            elif 'fastapi' in dep_lower and 'FastAPI' not in detected:
                badges.append({"name": "FastAPI", "color": self.BADGE_COLORS["FastAPI"]})
                detected.add('FastAPI')
            elif 'flask' in dep_lower and 'Flask' not in detected:
                badges.append({"name": "Flask", "color": self.BADGE_COLORS["Flask"]})
                detected.add('Flask')
        
        # Node dependencies
        for dep in node_deps:
            dep_lower = dep.lower()
            
            if 'react' in dep_lower and dep_lower != 'react-dom' and 'React' not in detected:
                badges.append({"name": "React", "color": self.BADGE_COLORS["React"]})
                detected.add('React')
            elif 'vue' in dep_lower and 'Vue' not in detected:
                badges.append({"name": "Vue", "color": self.BADGE_COLORS["Vue"]})
                detected.add('Vue')
            elif 'angular' in dep_lower and 'Angular' not in detected:
                badges.append({"name": "Angular", "color": self.BADGE_COLORS["Angular"]})
                detected.add('Angular')
            elif 'svelte' in dep_lower and 'Svelte' not in detected:
                badges.append({"name": "Svelte", "color": self.BADGE_COLORS["Svelte"]})
                detected.add('Svelte')
            elif 'framer-motion' in dep_lower and 'Framer Motion' not in detected:
                badges.append({"name": "Framer Motion", "color": self.BADGE_COLORS["Framer Motion"]})
                detected.add('Framer Motion')
            elif 'gsap' in dep_lower and 'GSAP' not in detected:
                badges.append({"name": "GSAP", "color": self.BADGE_COLORS["GSAP"]})
                detected.add('GSAP')
            elif 'three' in dep_lower and 'Three.js' not in detected:
                badges.append({"name": "Three.js", "color": self.BADGE_COLORS["Three.js"]})
                detected.add('Three.js')
            elif 'lucide' in dep_lower and 'Lucide' not in detected:
                badges.append({"name": "Lucide", "color": self.BADGE_COLORS["Lucide"]})
                detected.add('Lucide')
            elif 'heroicons' in dep_lower and 'Heroicons' not in detected:
                badges.append({"name": "Heroicons", "color": self.BADGE_COLORS["Heroicons"]})
                detected.add('Heroicons')
            elif 'axios' in dep_lower and 'Axios' not in detected:
                badges.append({"name": "Axios", "color": self.BADGE_COLORS["Axios"]})
                detected.add('Axios')
            elif 'tailwind' in dep_lower and 'Tailwind' not in detected:
                badges.append({"name": "Tailwind", "color": self.BADGE_COLORS["Tailwind"]})
                detected.add('Tailwind')
            elif '@mui' in dep_lower or 'material-ui' in dep_lower:
                if 'Material-UI' not in detected:
                    badges.append({"name": "Material-UI", "color": self.BADGE_COLORS["Material-UI"]})
                    detected.add('Material-UI')
            elif 'antd' in dep_lower and 'Ant Design' not in detected:
                badges.append({"name": "Ant Design", "color": self.BADGE_COLORS["Ant Design"]})
                detected.add('Ant Design')
            elif 'chakra' in dep_lower and 'Chakra UI' not in detected:
                badges.append({"name": "Chakra UI", "color": self.BADGE_COLORS["Chakra UI"]})
                detected.add('Chakra UI')
        
        return badges
    
    def detect_from_file_types(
        self,
        backend_path: str,
        frontend_path: str
    ) -> List[Dict[str, str]]:
        """Detect badges from file extensions"""
        badges = []
        detected = set()
        
        # Backend language detection
        backend_ext = Path(backend_path).suffix.lower()
        if backend_ext == '.py' and 'Python' not in detected:
            badges.append({"name": "Python", "color": self.BADGE_COLORS["Python"]})
            detected.add('Python')
        
        # Frontend language detection
        frontend_ext = Path(frontend_path).suffix.lower() if frontend_path else ''
        if frontend_ext in ['.tsx', '.ts'] and 'TypeScript' not in detected:
            badges.append({"name": "TypeScript", "color": self.BADGE_COLORS["TypeScript"]})
            detected.add('TypeScript')
        elif frontend_ext in ['.jsx', '.js'] and 'JavaScript' not in detected:
            badges.append({"name": "JavaScript", "color": self.BADGE_COLORS["JavaScript"]})
            detected.add('JavaScript')
        
        return badges
    
    def detect_from_category(self, category: str) -> List[Dict[str, str]]:
        """Detect badge from category"""
        badges = []
        
        category_badge_map = {
            "AI/ML": "AI/ML",
            "Data": "Data",
            "DevTools": "DevTools",
            "Multimedia": "Multimedia",
            "Utilities": "Utilities",
            "Web": "Web"
        }
        
        if category in category_badge_map:
            badge_name = category_badge_map[category]
            badges.append({
                "name": badge_name,
                "color": self.BADGE_COLORS.get(badge_name, self.BADGE_COLORS["Tool"])
            })
        
        return badges
    
    def generate_badges(
        self,
        python_deps: List[str],
        node_deps: List[str],
        backend_path: str,
        frontend_path: str,
        category: str
    ) -> List[Dict[str, str]]:
        """Generate all badges for a tool"""
        all_badges = []
        detected_names = set()
        
        # Priority order: File types → Dependencies → Category
        
        # 1. File type badges (always first)
        file_badges = self.detect_from_file_types(backend_path, frontend_path)
        for badge in file_badges:
            if badge["name"] not in detected_names:
                all_badges.append(badge)
                detected_names.add(badge["name"])
        
        # 2. Dependency badges
        dep_badges = self.detect_from_dependencies(python_deps, node_deps)
        for badge in dep_badges:
            if badge["name"] not in detected_names:
                all_badges.append(badge)
                detected_names.add(badge["name"])
        
        # 3. Category badge (last)
        category_badges = self.detect_from_category(category)
        for badge in category_badges:
            if badge["name"] not in detected_names:
                all_badges.append(badge)
                detected_names.add(badge["name"])
        
        return all_badges
