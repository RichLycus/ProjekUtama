"""
Color Picker Backend Tool

NAME: Color Picker
CATEGORY: DevTools
DESCRIPTION: Convert colors between formats (HEX, RGB, HSL) and generate color palettes
VERSION: 1.0.0
AUTHOR: ChimeraAI Team
"""

def hex_to_rgb(hex_color):
    """Convert HEX to RGB"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(r, g, b):
    """Convert RGB to HEX"""
    return f"#{r:02x}{g:02x}{b:02x}"

def rgb_to_hsl(r, g, b):
    """Convert RGB to HSL"""
    r, g, b = r/255, g/255, b/255
    max_c = max(r, g, b)
    min_c = min(r, g, b)
    l = (max_c + min_c) / 2
    
    if max_c == min_c:
        h = s = 0
    else:
        d = max_c - min_c
        s = d / (2 - max_c - min_c) if l > 0.5 else d / (max_c + min_c)
        
        if max_c == r:
            h = (g - b) / d + (6 if g < b else 0)
        elif max_c == g:
            h = (b - r) / d + 2
        else:
            h = (r - g) / d + 4
        h /= 6
    
    return (int(h * 360), int(s * 100), int(l * 100))

def run(params):
    """
    Execute color conversion
    
    Expected params:
    {
        "operation": "hex_to_rgb" | "rgb_to_hex" | "rgb_to_hsl" | "generate_palette",
        "hex": str (for hex_to_rgb),
        "r": int, "g": int, "b": int (for rgb operations)
    }
    """
    operation = params.get("operation", "hex_to_rgb")
    
    try:
        if operation == "hex_to_rgb":
            hex_color = params.get("hex", "#000000")
            r, g, b = hex_to_rgb(hex_color)
            return {
                "operation": "HEX to RGB",
                "input": hex_color,
                "result": f"rgb({r}, {g}, {b})",
                "values": {"r": r, "g": g, "b": b}
            }
        
        elif operation == "rgb_to_hex":
            r = int(params.get("r", 0))
            g = int(params.get("g", 0))
            b = int(params.get("b", 0))
            hex_color = rgb_to_hex(r, g, b)
            return {
                "operation": "RGB to HEX",
                "input": f"rgb({r}, {g}, {b})",
                "result": hex_color.upper(),
                "values": {"hex": hex_color}
            }
        
        elif operation == "rgb_to_hsl":
            r = int(params.get("r", 0))
            g = int(params.get("g", 0))
            b = int(params.get("b", 0))
            h, s, l = rgb_to_hsl(r, g, b)
            return {
                "operation": "RGB to HSL",
                "input": f"rgb({r}, {g}, {b})",
                "result": f"hsl({h}, {s}%, {l}%)",
                "values": {"h": h, "s": s, "l": l}
            }
        
        elif operation == "generate_palette":
            hex_color = params.get("hex", "#3498db")
            r, g, b = hex_to_rgb(hex_color)
            
            # Generate lighter and darker shades
            palette = []
            for i in range(-2, 3):
                factor = 1 + (i * 0.2)
                new_r = min(255, max(0, int(r * factor)))
                new_g = min(255, max(0, int(g * factor)))
                new_b = min(255, max(0, int(b * factor)))
                palette.append(rgb_to_hex(new_r, new_g, new_b))
            
            return {
                "operation": "Generate Palette",
                "base_color": hex_color,
                "palette": palette
            }
        
        else:
            return {"error": f"Unknown operation: {operation}"}
    
    except Exception as e:
        return {"error": str(e)}
