"""
Chat Flow Wireframe Logger
Modern, professional visualization of chat processing pipeline
"""

import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

# ANSI Color Codes
class Colors:
    """ANSI color codes for terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    
    # Colors
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    GRAY = '\033[90m'
    
    # Backgrounds
    BG_RED = '\033[101m'
    BG_GREEN = '\033[102m'
    BG_YELLOW = '\033[103m'
    BG_BLUE = '\033[104m'

# Box drawing characters
BOX = {
    'top_left': '╔',
    'top_right': '╗',
    'bottom_left': '╚',
    'bottom_right': '╝',
    'horizontal': '═',
    'vertical': '║',
    'left_t': '╠',
    'right_t': '╣',
    'horizontal_light': '─',
    'vertical_light': '│',
    'top_left_light': '┌',
    'top_right_light': '┐',
    'bottom_left_light': '└',
    'bottom_right_light': '┘',
    'left_t_light': '├',
    'right_t_light': '┤',
}

# Emojis for visual appeal
EMOJI = {
    'rocket': '🚀',
    'input': '📥',
    'output': '📤',
    'router': '🧭',
    'rag': '📚',
    'execution': '💻',
    'reasoning': '🤔',
    'persona': '🎭',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'time': '⏰',
    'duration': '⏱️',
    'stats': '📊',
    'metrics': '📈',
    'health': '⚡',
    'chat': '🗨️',
    'search': '🔍',
    'code': '🔨',
    'brain': '🧠',
    'art': '🎨',
    'checkmark': '✓',
    'hourglass': '⏳',
    'trophy': '🏆',
    'target': '🎯',
    'money': '💰',
    'fire': '🔥',
}


class ChatFlowLogger:
    """
    Professional Chat Flow Logger with modern wireframe visualization
    """
    
    def __init__(self, log_dir: str = "logs", colored: bool = True):
        """
        Initialize Chat Flow Logger
        
        Args:
            log_dir: Directory for log files (relative to project root)
            colored: Enable ANSI color codes
        """
        # Setup paths
        project_root = Path(__file__).parent.parent.parent
        self.log_dir = project_root / log_dir
        self.log_dir.mkdir(exist_ok=True)
        
        self.log_file = self.log_dir / "chat_flow.log"
        self.colored = colored
        
        # Timing tracking
        self.start_time = None
        self.step_times = {}
        self.step_start_times = {}
        
        # Metrics tracking
        self.metrics = {
            'total_tokens': 0,
            'input_tokens': 0,
            'output_tokens': 0,
            'errors': [],
            'warnings': [],
        }
        
        # Current message info
        self.message_id = None
        self.user_input = None
        self.persona = None
        
        # Step results
        self.results = {}
        
    def _write(self, text: str, to_file: bool = True):
        """Write to log file and optionally to console"""
        if to_file:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                # Remove ANSI codes for file output
                clean_text = self._strip_ansi(text)
                f.write(clean_text + '\n')
        
        # Always print to console
        print(text)
    
    def _strip_ansi(self, text: str) -> str:
        """Remove ANSI color codes from text"""
        import re
        ansi_escape = re.compile(r'\x1b\[[0-9;]*m')
        return ansi_escape.sub('', text)
    
    def _colorize(self, text: str, color: str) -> str:
        """Apply color to text if colored mode is enabled"""
        if self.colored:
            return f"{color}{text}{Colors.RESET}"
        return text
    
    def _progress_bar(self, percentage: float, width: int = 50, filled_char: str = '█', empty_char: str = '░') -> str:
        """Generate a progress bar"""
        filled = int(width * percentage / 100)
        empty = width - filled
        bar = filled_char * filled + empty_char * empty
        return f"{bar} {percentage:5.1f}%"
    
    def _horizontal_line(self, width: int = 85, heavy: bool = True) -> str:
        """Generate horizontal line"""
        char = BOX['horizontal'] if heavy else BOX['horizontal_light']
        return char * width
    
    def _box_line(self, content: str, width: int = 85, align: str = 'left') -> str:
        """Generate a line within a box"""
        left = BOX['vertical']
        right = BOX['vertical']
        
        # Calculate padding
        content_length = len(self._strip_ansi(content))
        available_width = width - 4  # Account for borders and spaces
        
        if align == 'center':
            padding_total = available_width - content_length
            padding_left = padding_total // 2
            padding_right = padding_total - padding_left
            line = f"{left}  {' ' * padding_left}{content}{' ' * padding_right}  {right}"
        elif align == 'right':
            padding = available_width - content_length
            line = f"{left}  {' ' * padding}{content}  {right}"
        else:  # left
            padding = available_width - content_length
            line = f"{left}  {content}{' ' * padding}  {right}"
        
        return line
    
    def start_message(self, message_id: str, user_input: str, persona: Dict[str, Any]):
        """Start logging a new message"""
        self.start_time = time.time()
        self.message_id = message_id
        self.user_input = user_input
        self.persona = persona
        self.results = {}
        self.step_times = {}
        self.step_start_times = {}
        self.metrics = {
            'total_tokens': 0,
            'input_tokens': 0,
            'output_tokens': 0,
            'errors': [],
            'warnings': [],
        }
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        
        # Build header
        lines = []
        lines.append("")
        lines.append(self._colorize(BOX['top_left'] + self._horizontal_line() + BOX['top_right'], Colors.CYAN))
        lines.append(self._box_line("", align='center'))
        lines.append(self._box_line(
            self._colorize(f"{EMOJI['rocket']} CHIMERA AI - CHAT PROCESSING PIPELINE", Colors.BOLD + Colors.CYAN),
            align='center'
        ))
        lines.append(self._box_line(
            self._colorize(self._horizontal_line(width=77, heavy=False), Colors.CYAN),
            align='center'
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{EMOJI['chat']} Message ID: ", Colors.GRAY) + 
            self._colorize(message_id[:36], Colors.WHITE)
        ))
        lines.append(self._box_line(
            self._colorize(f"{EMOJI['time']} Timestamp: ", Colors.GRAY) + 
            self._colorize(timestamp, Colors.WHITE)
        ))
        
        persona_name = persona.get('ai_name', persona.get('name', 'Unknown'))
        lines.append(self._box_line(
            self._colorize(f"{EMOJI['persona']} Persona: ", Colors.GRAY) + 
            self._colorize(f"{persona_name} (Technical Assistant)", Colors.MAGENTA)
        ))
        
        lines.append(self._box_line(""))
        lines.append(self._colorize(BOX['left_t'] + self._horizontal_line() + BOX['right_t'], Colors.CYAN))
        lines.append(self._box_line(""))
        
        # User input section
        lines.append(self._box_line(self._colorize(f"{EMOJI['input']} USER INPUT", Colors.BOLD + Colors.YELLOW)))
        lines.append(self._box_line(self._colorize(BOX['top_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['top_right_light'], Colors.GRAY)))
        
        # Split long input into multiple lines
        max_line_length = 77
        words = user_input.split()
        current_line = ""
        for word in words:
            if len(current_line) + len(word) + 1 <= max_line_length:
                current_line += (word + " ")
            else:
                if current_line:
                    lines.append(self._box_line(
                        self._colorize(f"{BOX['vertical_light']} ", Colors.GRAY) + 
                        current_line.strip() + 
                        self._colorize(f" {' ' * (max_line_length - len(current_line.strip()))} {BOX['vertical_light']}", Colors.GRAY)
                    ))
                current_line = word + " "
        if current_line:
            lines.append(self._box_line(
                self._colorize(f"{BOX['vertical_light']} ", Colors.GRAY) + 
                f'"{current_line.strip()}"' + 
                self._colorize(f" {' ' * (max_line_length - len(current_line.strip()) - 2)} {BOX['vertical_light']}", Colors.GRAY)
            ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + 
            " " * 79 + 
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Input stats
        input_length = len(user_input)
        complexity = "Low" if input_length < 50 else "Medium" if input_length < 150 else "High"
        complexity_color = Colors.GREEN if complexity == "Low" else Colors.YELLOW if complexity == "Medium" else Colors.RED
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']} {EMOJI['stats']} Input Stats:", Colors.GRAY)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}    • Length: ", Colors.GRAY) + 
            self._colorize(f"{input_length} chars", Colors.WHITE) + 
            self._colorize(f" {' ' * (70 - len(str(input_length)) - 11)} {BOX['vertical_light']}", Colors.GRAY)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}    • Complexity: ", Colors.GRAY) + 
            self._colorize(complexity, complexity_color) + 
            self._colorize(f" {' ' * (70 - len(complexity) - 18)} {BOX['vertical_light']}", Colors.GRAY)
        ))
        
        lines.append(self._box_line(self._colorize(BOX['bottom_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['bottom_right_light'], Colors.GRAY)))
        lines.append(self._box_line(""))
        lines.append(self._colorize(BOX['left_t'] + self._horizontal_line() + BOX['right_t'], Colors.CYAN))
        lines.append(self._box_line(""))
        lines.append(self._box_line(self._colorize(f"{EMOJI['target']} PROCESSING PIPELINE", Colors.BOLD + Colors.CYAN)))
        lines.append(self._box_line(""))
        
        for line in lines:
            self._write(line)
    
    def start_step(self, step_name: str, step_number: int, total_steps: int = 5):
        """Start logging a pipeline step"""
        self.step_start_times[step_name] = time.time()
    
    def end_step(self, step_name: str, result: Dict[str, Any]):
        """End logging a pipeline step and record results"""
        if step_name in self.step_start_times:
            duration = time.time() - self.step_start_times[step_name]
            self.step_times[step_name] = duration
            self.results[step_name] = result
            
            # Update metrics
            if 'tokens' in result:
                self.metrics['total_tokens'] += result['tokens']
                if 'input_tokens' in result:
                    self.metrics['input_tokens'] += result['input_tokens']
                if 'output_tokens' in result:
                    self.metrics['output_tokens'] += result['output_tokens']
    
    def log_router(self, intent: str, confidence: float, keywords: list, model_info: Dict, duration: float, agent_display_name: str = None):
        """Log router agent step"""
        lines = []
        
        lines.append(self._box_line(self._colorize(BOX['top_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['top_right_light'], Colors.GRAY)))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Use agent display name from database or fallback
        display_name = agent_display_name if agent_display_name else "ROUTER AGENT"
        
        # Header - format duration properly (avoid 0.0s display)
        if duration < 0.01:
            duration_str = "<0.01s"
        else:
            duration_str = f"{duration:.2f}s"
        
        status_icon = self._colorize(f"{EMOJI['success']} {duration_str}", Colors.GREEN)
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  [1/5] {EMOJI['router']} {display_name.upper()}", Colors.BOLD + Colors.BLUE) +
            " " * (56 - len(display_name) - len(duration_str)) + status_icon +
            self._colorize(f"  {BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Progress bar
        progress = self._progress_bar(100, width=57)
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {progress}             {BOX['vertical_light']}", Colors.GREEN)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Model info
        model_name = model_info.get('model_name', 'Unknown')
        temperature = model_info.get('temperature', 0.0)
        max_tokens = model_info.get('max_tokens', 0)
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} Model: ", Colors.GRAY) +
            self._colorize(model_name, Colors.CYAN)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} Temperature: ", Colors.GRAY) +
            self._colorize(f"{temperature}", Colors.WHITE) +
            self._colorize(" | Max Tokens: ", Colors.GRAY) +
            self._colorize(f"{max_tokens}", Colors.WHITE)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} Status: ", Colors.GRAY) +
            self._colorize("ACTIVE", Colors.GREEN)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Classification results
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} {EMOJI['target']} Classification Phase:", Colors.GRAY)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {BOX['left_t_light']}{BOX['horizontal_light']} Intent: ", Colors.GRAY) +
            self._colorize(intent.upper(), Colors.YELLOW)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {BOX['left_t_light']}{BOX['horizontal_light']} Confidence: ", Colors.GRAY) +
            self._colorize(f"{confidence:.1f}%", Colors.GREEN if confidence > 80 else Colors.YELLOW)
        ))
        
        if keywords:
            keywords_str = ", ".join(keywords[:5])
            lines.append(self._box_line(
                self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {BOX['bottom_left_light']}{BOX['horizontal_light']} Keywords: ", Colors.GRAY) +
                self._colorize(f"[{keywords_str}]", Colors.CYAN)
            ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        lines.append(self._box_line(self._colorize(BOX['bottom_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['bottom_right_light'], Colors.GRAY)))
        
        for line in lines:
            self._write(line)
    
    def log_rag(self, docs_found: int, relevant_docs: int, context_length: int, duration: float, agent_display_name: str = None):
        """Log RAG agent step"""
        lines = []
        
        lines.append(self._box_line(self._colorize(BOX['top_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['top_right_light'], Colors.GRAY)))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Use agent display name from database or fallback
        display_name = agent_display_name if agent_display_name else "RAG AGENT"
        
        # Format duration properly
        if duration < 0.01:
            duration_str = "<0.01s"
        else:
            duration_str = f"{duration:.2f}s"
        
        status_icon = self._colorize(f"{EMOJI['success']} {duration_str}", Colors.GREEN)
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  [2/5] {EMOJI['rag']} {display_name.upper()}", Colors.BOLD + Colors.BLUE) +
            " " * (58 - len(display_name) - len(duration_str)) + status_icon +
            self._colorize(f"  {BOX['vertical_light']}", Colors.GRAY)
        ))
        
        progress = self._progress_bar(100, width=57)
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {progress}             {BOX['vertical_light']}", Colors.GREEN)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} Vector Database: ", Colors.GRAY) +
            self._colorize("ChromaDB", Colors.CYAN)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} Strategy: ", Colors.GRAY) +
            self._colorize("SEMANTIC_SEARCH", Colors.YELLOW)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}", Colors.GRAY)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} {EMOJI['search']} Search Results:", Colors.GRAY)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {BOX['left_t_light']}{BOX['horizontal_light']} Documents found: ", Colors.GRAY) +
            self._colorize(f"{docs_found}", Colors.WHITE)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {BOX['left_t_light']}{BOX['horizontal_light']} Relevant docs: ", Colors.GRAY) +
            self._colorize(f"{relevant_docs}", Colors.GREEN if relevant_docs > 0 else Colors.YELLOW)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {BOX['bottom_left_light']}{BOX['horizontal_light']} Context length: ", Colors.GRAY) +
            self._colorize(f"{context_length:,} chars", Colors.WHITE)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        lines.append(self._box_line(self._colorize(BOX['bottom_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['bottom_right_light'], Colors.GRAY)))
        
        for line in lines:
            self._write(line)
    
    def log_specialized_agent(self, agent_name: str, agent_type: str, model_info: Dict, metrics: Dict, duration: float, step_num: int, agent_display_name: str = None):
        """Log specialized agent (code, chat, analysis, creative, tool)"""
        lines = []
        
        emoji_map = {
            'code': EMOJI['code'],
            'chat': EMOJI['chat'],
            'analysis': EMOJI['brain'],
            'creative': EMOJI['art'],
            'tool': EMOJI['target'],
        }
        
        emoji = emoji_map.get(agent_type.lower(), EMOJI['execution'])
        
        # Use agent display name from database or fallback
        display_name = agent_display_name if agent_display_name else agent_name
        
        lines.append(self._box_line(self._colorize(BOX['top_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['top_right_light'], Colors.GRAY)))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Format duration properly
        if duration < 0.01:
            duration_str = "<0.01s"
        else:
            duration_str = f"{duration:.2f}s"
        
        status_icon = self._colorize(f"{EMOJI['success']} {duration_str}", Colors.GREEN)
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  [{step_num}/5] {emoji} {display_name.upper()}", Colors.BOLD + Colors.BLUE) +
            " " * (60 - len(display_name) - len(duration_str)) + status_icon +
            self._colorize(f"  {BOX['vertical_light']}", Colors.GRAY)
        ))
        
        progress = self._progress_bar(100, width=57)
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {progress}             {BOX['vertical_light']}", Colors.GREEN)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Model info
        model_name = model_info.get('model_name', 'Unknown')
        temperature = model_info.get('temperature', 0.0)
        max_tokens = model_info.get('max_tokens', 0)
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} Model: ", Colors.GRAY) +
            self._colorize(model_name, Colors.CYAN)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} Temperature: ", Colors.GRAY) +
            self._colorize(f"{temperature}", Colors.WHITE) +
            self._colorize(" | Max Tokens: ", Colors.GRAY) +
            self._colorize(f"{max_tokens}", Colors.WHITE)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Metrics
        if metrics:
            lines.append(self._box_line(
                self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} {EMOJI['stats']} Metrics:", Colors.GRAY)
            ))
            
            if 'tokens_generated' in metrics:
                lines.append(self._box_line(
                    self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {BOX['left_t_light']}{BOX['horizontal_light']} Tokens generated: ", Colors.GRAY) +
                    self._colorize(f"{metrics['tokens_generated']:,}", Colors.WHITE)
                ))
            
            if 'response_length' in metrics:
                lines.append(self._box_line(
                    self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {BOX['left_t_light']}{BOX['horizontal_light']} Response length: ", Colors.GRAY) +
                    self._colorize(f"{metrics['response_length']} chars", Colors.WHITE)
                ))
            
            if 'quality_score' in metrics:
                score = metrics['quality_score']
                score_color = Colors.GREEN if score > 80 else Colors.YELLOW if score > 60 else Colors.RED
                lines.append(self._box_line(
                    self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {BOX['bottom_left_light']}{BOX['horizontal_light']} Quality: ", Colors.GRAY) +
                    self._colorize(f"{score}/100", score_color)
                ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        lines.append(self._box_line(self._colorize(BOX['bottom_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['bottom_right_light'], Colors.GRAY)))
        
        for line in lines:
            self._write(line)
    
    def log_persona(self, persona_name: str, traits: Dict, model_info: Dict, duration: float, agent_display_name: str = None, step_num: int = 5):
        """Log persona agent step"""
        lines = []
        
        lines.append(self._box_line(self._colorize(BOX['top_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['top_right_light'], Colors.GRAY)))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Use agent display name from database or fallback
        display_name = agent_display_name if agent_display_name else f"PERSONA AGENT ({persona_name})"
        if agent_display_name and persona_name:
            display_name = f"{agent_display_name} ({persona_name})"
        
        # Format duration properly
        if duration < 0.01:
            duration_str = "<0.01s"
        else:
            duration_str = f"{duration:.2f}s"
        
        status_icon = self._colorize(f"{EMOJI['success']} {duration_str}", Colors.GREEN)
        
        # Calculate padding dynamically
        padding = max(0, 60 - len(display_name) - len(duration_str))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  [{step_num}/5] {EMOJI['persona']} {display_name.upper()}", Colors.BOLD + Colors.MAGENTA) +
            " " * padding + status_icon +
            self._colorize(f"  {BOX['vertical_light']}", Colors.GRAY)
        ))
        
        progress = self._progress_bar(100, width=57)
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {progress}             {BOX['vertical_light']}", Colors.GREEN)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Model info
        model_name = model_info.get('model_name', 'Unknown')
        temperature = model_info.get('temperature', 0.0)
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} Model: ", Colors.GRAY) +
            self._colorize(model_name, Colors.CYAN)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} Temperature: ", Colors.GRAY) +
            self._colorize(f"{temperature}", Colors.WHITE)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        # Personality traits
        if traits:
            lines.append(self._box_line(
                self._colorize(f"{BOX['vertical_light']}  {BOX['left_t_light']}{BOX['horizontal_light']} {EMOJI['art']} Personality Traits:", Colors.GRAY)
            ))
            
            trait_names = {
                'technical': 'Technical depth',
                'friendly': 'Friendliness',
                'direct': 'Directness',
                'creative': 'Creativity',
                'professional': 'Professionalism'
            }
            
            for idx, (key, value) in enumerate(traits.items()):
                if key in trait_names:
                    is_last = idx == len(traits) - 1
                    branch = BOX['bottom_left_light'] if is_last else BOX['left_t_light']
                    
                    bar_length = int(value / 10)
                    bar = '█' * bar_length + '░' * (10 - bar_length)
                    
                    lines.append(self._box_line(
                        self._colorize(f"{BOX['vertical_light']}  {BOX['vertical_light']}   {branch}{BOX['horizontal_light']} {trait_names[key]}: ", Colors.GRAY) +
                        self._colorize(bar, Colors.MAGENTA) +
                        self._colorize(f" {value}%", Colors.WHITE)
                    ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        lines.append(self._box_line(self._colorize(BOX['bottom_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['bottom_right_light'], Colors.GRAY)))
        
        for line in lines:
            self._write(line)
    
    def finish_message(self, response_length: int, success: bool = True):
        """Finish logging and show performance dashboard"""
        total_duration = time.time() - self.start_time if self.start_time else 0
        
        lines = []
        
        # Output section
        lines.append(self._box_line(""))
        lines.append(self._colorize(BOX['left_t'] + self._horizontal_line() + BOX['right_t'], Colors.CYAN))
        lines.append(self._box_line(""))
        lines.append(self._box_line(self._colorize(f"{EMOJI['output']} FINAL OUTPUT", Colors.BOLD + Colors.GREEN if success else Colors.RED)))
        lines.append(self._box_line(self._colorize(BOX['top_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['top_right_light'], Colors.GRAY)))
        
        status_text = f"{EMOJI['success']} Response generated successfully!" if success else f"{EMOJI['error']} Processing failed"
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']} {status_text}", Colors.GREEN if success else Colors.RED) +
            " " * (78 - len(self._strip_ansi(status_text))) +
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
        ))
        
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']} {EMOJI['stats']} Output Statistics:", Colors.GRAY)
        ))
        lines.append(self._box_line(
            self._colorize(f"{BOX['vertical_light']}    • Content length: ", Colors.GRAY) +
            self._colorize(f"{response_length:,} chars", Colors.WHITE)
        ))
        
        lines.append(self._box_line(self._colorize(BOX['bottom_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['bottom_right_light'], Colors.GRAY)))
        lines.append(self._box_line(""))
        
        # Performance Dashboard
        lines.append(self._colorize(BOX['left_t'] + self._horizontal_line() + BOX['right_t'], Colors.CYAN))
        lines.append(self._box_line(""))
        lines.append(self._box_line(self._colorize(f"{EMOJI['metrics']} PERFORMANCE DASHBOARD", Colors.BOLD + Colors.CYAN)))
        lines.append(self._box_line(self._colorize(self._horizontal_line(width=77, heavy=False), Colors.CYAN), align='center'))
        lines.append(self._box_line(""))
        lines.append(self._box_line(
            self._colorize(f"{EMOJI['duration']}  Total Duration: ", Colors.GRAY) +
            self._colorize(f"{total_duration:.3f} seconds", Colors.YELLOW)
        ))
        lines.append(self._box_line(""))
        
        # Time breakdown visualization
        if self.step_times:
            lines.append(self._box_line(self._colorize(BOX['top_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['top_right_light'], Colors.GRAY)))
            lines.append(self._box_line(
                self._colorize(f"{BOX['vertical_light']} Time Breakdown:", Colors.GRAY) +
                " " * 63 +
                self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
            ))
            lines.append(self._box_line(
                self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
            ))
            
            # Find slowest step
            slowest_step = max(self.step_times.items(), key=lambda x: x[1]) if self.step_times else (None, 0)
            
            for step_name, step_time in self.step_times.items():
                percentage = (step_time / total_duration * 100) if total_duration > 0 else 0
                bar_width = int(percentage / 100 * 30)
                bar = '█' * bar_width + '░' * (30 - bar_width)
                
                # Add warning if slowest
                warning = self._colorize(f"  {EMOJI['warning']} SLOWEST", Colors.RED) if step_name == slowest_step[0] and len(self.step_times) > 1 else ""
                
                step_display = step_name.capitalize().ljust(12)
                lines.append(self._box_line(
                    self._colorize(f"{BOX['vertical_light']}  {step_display}", Colors.GRAY) +
                    self._colorize(bar, Colors.YELLOW) +
                    self._colorize(f"  {percentage:5.1f}%  ({step_time:.1f}s)", Colors.WHITE) +
                    warning +
                    " " * (24 - len(warning)) +
                    self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
                ))
            
            lines.append(self._box_line(
                self._colorize(f"{BOX['vertical_light']}", Colors.GRAY) + " " * 79 + self._colorize(f"{BOX['vertical_light']}", Colors.GRAY)
            ))
            lines.append(self._box_line(self._colorize(BOX['bottom_left_light'] + self._horizontal_line(width=81, heavy=False) + BOX['bottom_right_light'], Colors.GRAY)))
        
        lines.append(self._box_line(""))
        
        # Token usage
        if self.metrics['total_tokens'] > 0:
            lines.append(self._box_line(
                self._colorize(f"{EMOJI['money']} Token Usage:", Colors.GRAY)
            ))
            lines.append(self._box_line(
                self._colorize(f"   • Total tokens: ", Colors.GRAY) +
                self._colorize(f"{self.metrics['total_tokens']:,}", Colors.WHITE)
            ))
            
            if total_duration > 0:
                tokens_per_sec = self.metrics['total_tokens'] / total_duration
                lines.append(self._box_line(
                    self._colorize(f"   • Avg tokens/sec: ", Colors.GRAY) +
                    self._colorize(f"{tokens_per_sec:,.0f}", Colors.GREEN)
                ))
        
        lines.append(self._box_line(""))
        
        # System health
        lines.append(self._box_line(
            self._colorize(f"{EMOJI['health']} System Health:", Colors.GRAY)
        ))
        lines.append(self._box_line(
            self._colorize(f"   • All agents: ", Colors.GRAY) +
            self._colorize(f"{EMOJI['success']} OPERATIONAL", Colors.GREEN)
        ))
        
        lines.append(self._box_line(""))
        lines.append(self._colorize(BOX['left_t'] + self._horizontal_line() + BOX['right_t'], Colors.CYAN))
        lines.append(self._box_line(""))
        
        status_display = self._colorize(f"{EMOJI['success']} PIPELINE STATUS: SUCCESS", Colors.BOLD + Colors.GREEN) if success else self._colorize(f"{EMOJI['error']} PIPELINE STATUS: FAILED", Colors.BOLD + Colors.RED)
        lines.append(self._box_line(status_display))
        
        finish_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        lines.append(self._box_line(
            self._colorize(f"{EMOJI['trophy']} Completed at: ", Colors.GRAY) +
            self._colorize(f"{finish_time} (Total: {total_duration:.3f}s)", Colors.WHITE)
        ))
        
        lines.append(self._box_line(""))
        lines.append(self._colorize(BOX['bottom_left'] + self._horizontal_line() + BOX['bottom_right'], Colors.CYAN))
        lines.append("")
        
        for line in lines:
            self._write(line)


# Global logger instance
_logger_instance = None

def get_chat_flow_logger(log_dir: str = "logs", colored: bool = True) -> ChatFlowLogger:
    """Get or create global ChatFlowLogger instance"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = ChatFlowLogger(log_dir=log_dir, colored=colored)
    return _logger_instance
