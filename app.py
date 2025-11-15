"""
================================================================================
EcoOyster - Oyster Production Prediction System
Backend API Server
================================================================================

This Flask application provides the backend API for the EcoOyster system.
It handles prediction calculations and AI-powered recommendations for oyster
farming using Together AI's language model.

Author: EcoOyster Development Team
Version: 1.0.0
================================================================================
"""

# ============================================================================
# IMPORTS AND DEPENDENCIES
# ============================================================================

import os
import re
import warnings
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
# Lazy import Together to avoid slow startup
# from together import Together

# ============================================================================
# CONFIGURATION AND INITIALIZATION
# ============================================================================

# Suppress Flask development server warnings
warnings.filterwarnings('ignore', message='.*development server.*')
warnings.filterwarnings('ignore', message='.*This is a development server.*')
warnings.filterwarnings('ignore', category=UserWarning, module='werkzeug')

# Flask application initialization
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable Cross-Origin Resource Sharing

# Together AI API configuration
TOGETHER_API_KEY = os.getenv(
    'TOGETHER_API_KEY', 
    'tgp_v1_rQ3i3iNCz3UaTBeVo_iBAvfB_OVdSQ1Q8kOpt6izrf8'
)
# Lazy initialization - client will be created when first needed
_client = None

def get_client():
    """Get or create the Together AI client (lazy initialization)."""
    global _client
    if _client is None:
        # Lazy import to avoid slow startup
        from together import Together
        _client = Together(api_key=TOGETHER_API_KEY)
    return _client

# AI Model configuration
AI_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct-Lite"
AI_TEMPERATURE = 0.3
AI_MAX_TOKENS_RECOMMENDATIONS = 500
AI_MAX_TOKENS_DETAILED = 800

# ============================================================================
# HELPER FUNCTIONS - Production Calculation
# ============================================================================

def calculate_oyster_production(salinity, farming_technique, typhoon, flood):
    """
    Calculate predicted oyster production using the formula:
    Oyster Production = 0.268(Salinity) + 0.567(Farming Technique) + 0.436(Typhoon) + 0.223(Flood) - 4.595
    
    Args:
        salinity (float): Salinity level in ppt
        farming_technique (int): 1=Raft, 2=Stake, 3=Both Raft and Stake
        typhoon (int): Number of typhoon events during the production period
        flood (int): Number of flood events during the production period
    
    Returns:
        float: Predicted oyster production in metric tons
    """
    production = (0.268 * salinity) + (0.567 * farming_technique) + (0.436 * typhoon) + (0.223 * flood) - 4.595
    # Ensure non-negative result
    return max(0, production)

def get_farming_technique_name(technique_code):
    """
    Convert farming technique code to name.
    
    Args:
        technique_code (int): Technique code (1, 2, or 3)
        
    Returns:
        str: Technique name
    """
    technique_map = {
        1: "Raft method",
        2: "Stake method",
        3: "Both Raft and Stake"
    }
    return technique_map.get(technique_code, "Unknown")

# ============================================================================
# HELPER FUNCTIONS - AI Response Processing
# ============================================================================

def parse_ai_recommendations(raw_response):
    """
    Parse and extract AI recommendations from raw response.
    
    Handles multiple formats:
    - Multi-line format with category headers (**Category**)
    - Markdown headers (# Category)
    - Extracts only the structured recommendations (category headers and bullet points)
    
    Args:
        raw_response (str): Raw text response from AI
        
    Returns:
        str: Clean, formatted recommendations text
    """
    lines = raw_response.split('\n')
    recommendations = []
    start_found = False
    
    for line in lines:
        line_stripped = line.strip()
        
        # Check if this is a category header
        if re.match(r'^\*\*.*\*\*$', line_stripped) or re.match(r'^#+\s+', line_stripped):
            start_found = True
            recommendations.append(line)
            continue
        
        # Once we've found the start, include category headers and bullet points
        if start_found:
            # Include empty lines for formatting
            if not line_stripped:
                recommendations.append(line)
            # Include bullet points (•, -, or *)
            elif re.match(r'^[•\-\*]\s+', line_stripped):
                recommendations.append(line)
            # Include category headers if they appear again
            elif re.match(r'^\*\*.*\*\*$', line_stripped) or re.match(r'^#+\s+', line_stripped):
                recommendations.append(line)
    
    # If we didn't find a start, try to extract from anywhere in the text
    if not start_found:
        category_pattern = r'\*\*[^*]+\*\*|#+\s+[^\n]+'
        matches = list(re.finditer(category_pattern, raw_response))
        if matches:
            # Start from the first category header
            start_pos = matches[0].start()
            return raw_response[start_pos:].strip()
        # Final fallback: return raw response
        return raw_response.strip()
    
    return '\n'.join(recommendations).strip()

# ============================================================================
# AI INTEGRATION FUNCTIONS
# ============================================================================

def get_ai_recommendations(salinity, farming_technique, typhoon, flood, predicted_production):
    """
    Get AI-generated recommendations for oyster farming based on input parameters.
    
    Uses Together AI to generate comprehensive recommendations covering:
    - Farming technique optimization
    - Salinity management
    - Weather & disaster preparedness
    - Environmental monitoring
    - Production timing
    - Best practices & sustainability
    
    Args:
        salinity (float): Salinity level in ppt
        farming_technique (int): 1=Raft, 2=Stake, 3=Both
        typhoon (int): Number of typhoon events during the production period
        flood (int): Number of flood events during the production period
        predicted_production (float): Predicted oyster production in metric tons
        
    Returns:
        str: Formatted recommendations text
    """
    technique_name = get_farming_technique_name(farming_technique)
    typhoon_text = f"{typhoon} event(s)" if typhoon == 1 else f"{typhoon} events"
    flood_text = f"{flood} event(s)" if flood == 1 else f"{flood} events"
    
    prompt = f"""You are an expert aquaculture consultant specializing in oyster farming. Generate AI-driven recommendations that are fully aligned with the predicted oyster production of {predicted_production:.2f} metric tons and the specific farming technique ({technique_name}) being used.

Input data:
- Predicted production: {predicted_production:.2f} metric tons
- Salinity: {salinity} ppt
- Farming Technique: {technique_name}
- Typhoons: {typhoon_text}
- Floods: {flood_text}

CRITICAL REQUIREMENTS:
1. Every recommendation MUST directly reflect and align with the predicted production value of {predicted_production:.2f} metric tons
2. All suggestions must be specific to the {technique_name} farming technique
3. Provide actionable guidance to optimize production, improve efficiency, and maintain sustainability
4. Emphasize practical strategies that maximize yield based on the predicted results
5. Consider the local environmental conditions (salinity: {salinity} ppt, weather events)
6. Incorporate best aquaculture practices relevant to the specific conditions
7. Recommendations should help achieve or exceed the predicted {predicted_production:.2f} metric tons production
8. Start directly with category headers - NO introductory sentences, NO meta-commentary, NO explanations

Output format (provide specific, actionable recommendations):

**Farming Technique Optimization**
• [Specific action for {technique_name} to optimize production toward {predicted_production:.2f} metric tons]
• [Action to improve efficiency with {technique_name}]

**Salinity Management**
• [Action to manage {salinity} ppt salinity for optimal production]
• [Strategy to maintain ideal salinity conditions]

**Weather & Disaster Preparedness**
• [Action based on {typhoon_text} typhoons, {flood_text} floods]
• [Preparedness strategy for the specific weather conditions]

**Environmental Monitoring**
• [Monitoring action for optimal production conditions]
• [Tracking strategy for production optimization]

**Production Timing**
• [Timing strategy to maximize yield toward {predicted_production:.2f} metric tons]
• [Schedule optimization based on environmental conditions]

**Best Practices & Sustainability**
• [Sustainable practice to maintain long-term production]
• [Best practice to improve efficiency and yield]

Begin immediately with "**Farming Technique Optimization**" - no other text before it. All recommendations must be practical, actionable, and directly relevant to achieving the predicted production."""

    try:
        client = get_client()
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a concise expert. Output ONLY the final recommendations. No explanations, no thinking process, no meta-commentary."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=AI_TEMPERATURE,
            max_tokens=AI_MAX_TOKENS_RECOMMENDATIONS
        )
        
        raw_response = response.choices[0].message.content.strip()
        return parse_ai_recommendations(raw_response)
        
    except Exception as e:
        return f"Error generating recommendations: {str(e)}"

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    API Endpoint: Predict oyster production and get AI recommendations.
    
    Request Body (JSON):
        {
            "salinity": 15.02,
            "farming_technique": 1,
            "typhoon": 0,
            "flood": 0
        }
    
    Response (JSON):
        {
            "success": true,
            "predicted_production": 12.34,
            "recommendations": "..."
        }
    
    Status Codes:
        200: Success
        400: Bad Request (missing or invalid parameters)
        500: Internal Server Error
    
    Note: All numeric fields represent counts or measurements during the production period.
    """
    try:
        # Validate request data
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        salinity = data.get('salinity')
        farming_technique = data.get('farming_technique')
        typhoon = data.get('typhoon')
        flood = data.get('flood')
        
        if (salinity is None or farming_technique is None or 
            typhoon is None or flood is None):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Calculate predicted production (only uses: salinity, farming_technique, typhoon, flood)
        predicted_production = calculate_oyster_production(
            float(salinity),
            int(farming_technique),
            int(typhoon),
            int(flood)
        )
        
        # Get AI recommendations
        recommendations = get_ai_recommendations(
            float(salinity),
            int(farming_technique),
            int(typhoon),
            int(flood),
            predicted_production
        )
        
        # Return success response
        return jsonify({
            "success": True,
            "predicted_production": predicted_production,
            "recommendations": recommendations
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    API Endpoint: Health check for monitoring and load balancers.
    
    Returns:
        JSON: {"status": "healthy"}
        Status Code: 200
    """
    return jsonify({"status": "healthy"}), 200


@app.route('/')
def index():
    """
    Serve the main HTML page.
    
    Returns:
        HTML: index.html file
    """
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """
    Serve static files (CSS, JS, images, etc.).
    
    Args:
        path (str): Path to the static file
        
    Returns:
        File: Requested static file
    """
    return send_from_directory('.', path)

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    import logging
    import sys
    
    # Suppress Flask development server warning
    class NoDevelopmentServerWarning(logging.Filter):
        def filter(self, record):
            message = record.getMessage()
            return 'development server' not in message.lower() and 'This is a development server' not in message
    
    # Configure logging - allow INFO level to show server URL and requests
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.INFO)
    # Remove default handlers and add filtered handler
    log.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(NoDevelopmentServerWarning())
    log.addHandler(handler)
    
    # Print server startup message
    print("\n" + "="*60)
    print("EcoOyster Server Starting...")
    print("="*60)
    print("Server running at: http://127.0.0.1:5000")
    print("Press CTRL+C to quit")
    print("="*60 + "\n")
    
    # Run Flask development server
    # Use explicit host and disable reloader for faster startup on Windows
    app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)
