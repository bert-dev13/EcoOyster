"""
Flask backend for Oyster Production Prediction System
Handles prediction calculations and Together AI API integration for farming recommendations
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from together import Together
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable CORS for frontend requests

# Initialize Together AI client
TOGETHER_API_KEY = "tgp_v1_rQ3i3iNCz3UaTBeVo_iBAvfB_OVdSQ1Q8kOpt6izrf8"
client = Together(api_key=TOGETHER_API_KEY)

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
    """Convert farming technique code to name"""
    technique_map = {
        1: "Raft method",
        2: "Stake method",
        3: "Both Raft and Stake"
    }
    return technique_map.get(technique_code, "Unknown")

def get_ai_recommendations(salinity, temperature, storms, severe_events, farming_technique, typhoon, flood, predicted_production):
    """
    Get AI-generated recommendations for oyster farming based on input parameters
    
    Args:
        salinity (float): Salinity level in ppt
        temperature (float): Water temperature in °C
        storms (int): Number of storm occurrences
        severe_events (int): Number of severe weather events
        farming_technique (int): 1=Raft, 2=Stake, 3=Both
        typhoon (int): Number of typhoon events during the production period
        flood (int): Number of flood events during the production period
        predicted_production (float): Predicted oyster production in metric tons
    
    Returns:
        str: AI-generated recommendations text
    """
    technique_name = get_farming_technique_name(farming_technique)
    typhoon_text = f"{typhoon} event(s)" if typhoon == 1 else f"{typhoon} events"
    flood_text = f"{flood} event(s)" if flood == 1 else f"{flood} events"
    storms_text = f"{storms} occurrence(s)" if storms == 1 else f"{storms} occurrences"
    severe_text = f"{severe_events} event(s)" if severe_events == 1 else f"{severe_events} events"
    
    prompt = f"""You are an expert aquaculture consultant specializing in oyster farming. Generate AI-driven recommendations that are fully aligned with the predicted oyster production of {predicted_production:.2f} metric tons and the specific farming technique ({technique_name}) being used.

Input data:
- Predicted production: {predicted_production:.2f} metric tons
- Salinity: {salinity} ppt
- Temperature: {temperature} °C
- Storms: {storms_text}
- Severe Events: {severe_text}
- Farming Technique: {technique_name}
- Typhoons: {typhoon_text}
- Floods: {flood_text}

CRITICAL REQUIREMENTS:
1. Every recommendation MUST directly reflect and align with the predicted production value of {predicted_production:.2f} metric tons
2. All suggestions must be specific to the {technique_name} farming technique
3. Provide actionable guidance to optimize production, improve efficiency, and maintain sustainability
4. Emphasize practical strategies that maximize yield based on the predicted results
5. Consider the local environmental conditions (salinity: {salinity} ppt, temperature: {temperature}°C, weather events)
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
• [Action based on {storms_text} storms, {typhoon_text} typhoons, {flood_text} floods]
• [Preparedness strategy for the specific weather conditions]

**Environmental Monitoring**
• [Monitoring action for {temperature}°C temperature conditions]
• [Tracking strategy for production optimization]

**Production Timing**
• [Timing strategy to maximize yield toward {predicted_production:.2f} metric tons]
• [Schedule optimization based on environmental conditions]

**Best Practices & Sustainability**
• [Sustainable practice to maintain long-term production]
• [Best practice to improve efficiency and yield]

Begin immediately with "**Farming Technique Optimization**" - no other text before it. All recommendations must be practical, actionable, and directly relevant to achieving the predicted production."""

    try:
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        raw_response = response.choices[0].message.content
        
        # Clean up meta-commentary that might slip through
        import re
        lines = raw_response.split('\n')
        cleaned_lines = []
        
        # Find the start of actual recommendations (first category header)
        start_found = False
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            if not line_stripped:
                if start_found:
                    cleaned_lines.append(line)
                continue
            
            line_lower = line_stripped.lower()
            
            # Check if this is the start of recommendations (category header)
            if re.match(r'^\*\*.*\*\*$', line_stripped) or re.match(r'^#+\s+', line_stripped):
                start_found = True
                cleaned_lines.append(line)
                continue
            
            # Skip everything before the first category header
            if not start_found:
                continue
            
            # Meta-commentary patterns to remove
            meta_phrases = [
                'okay', 'so i need', 'let me start', 'let me', 'i need to', 'i should',
                'first,', 'first i', 'i\'ll', 'i will', 'i\'m going to', 'i am going to',
                'let me think', 'i think', 'i believe', 'i understand', 'they have',
                'the inputs include', 'the data shows', 'based on the', 'looking at',
                'considering', 'given that', 'since', 'because', 'as you can see',
                'it seems', 'it appears', 'it looks like', 'this means', 'this indicates',
                'thought process', 'reasoning', 'explanation', 'analysis', 'let me explain',
                'i should think', 'i should consider', 'i should focus', 'i should provide',
                'each point should', 'each recommendation', 'keep the language',
                'make it actionable', 'start with a verb', 'without any', 'just the',
                'to ensure', 'directly tied', 'targeting the', 'go through',
                'avoid any markdown', 'and i need', 'and let me', 'finally,',
                'in summary', 'to summarize', 'in conclusion', 'overall',
                'the user', 'the system', 'you have', 'you should know',
                'note that', 'remember that', 'keep in mind', 'it\'s important',
                'i should avoid', 'i should keep', 'i should make', 'i should start'
            ]
            
            # Check if line contains meta-commentary
            is_meta = False
            for phrase in meta_phrases:
                if phrase in line_lower:
                    is_meta = True
                    break
            
            # Check for patterns like "Okay, so..." or "Let me start by..."
            if re.match(r'^(okay|ok|well|so|now|first|let me|i need|i should|i\'ll|i will)', line_lower):
                is_meta = True
            
            # Check for sentences that describe what the AI is doing
            if re.search(r'(i\'m|i am|i\'ll|i will|let me|i need|i should)\s+(going to|trying to|planning to|thinking|considering|providing|giving|making|ensuring|checking|reviewing|listing|organizing)', line_lower):
                is_meta = True
            
            # Check for explanations of input values
            if re.search(r'(they have|the inputs|the data|the values|the system|the user)', line_lower):
                is_meta = True
            
            # Check for meta-instructions
            if re.search(r'(should start|should be|should include|should avoid|should keep|should make)', line_lower):
                is_meta = True
            
            # Keep only non-meta lines
            if not is_meta:
                cleaned_lines.append(line)
        
        cleaned_response = '\n'.join(cleaned_lines).strip()
        
        # If we didn't find a start, try to extract just the formatted recommendations
        if not start_found and cleaned_response:
            # Look for any category headers in the text
            category_pattern = r'\*\*[^*]+\*\*|#+\s+[^\n]+'
            matches = list(re.finditer(category_pattern, cleaned_response))
            if matches:
                # Start from the first category header
                start_pos = matches[0].start()
                cleaned_response = cleaned_response[start_pos:].strip()
        
        return cleaned_response
    except Exception as e:
        return f"Error generating recommendations: {str(e)}"

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    API endpoint to predict oyster production and get AI recommendations
    Expects JSON: {
        "salinity": 15.02,
        "temperature": 25.5,
        "storms": 0,
        "severe_events": 0,
        "farming_technique": 1,
        "typhoon": 0,
        "flood": 0
    }
    Note: All numeric fields represent counts or measurements during the production period.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        salinity = data.get('salinity')
        temperature = data.get('temperature')
        storms = data.get('storms')
        severe_events = data.get('severe_events')
        farming_technique = data.get('farming_technique')
        typhoon = data.get('typhoon')
        flood = data.get('flood')
        
        if (salinity is None or temperature is None or storms is None or 
            severe_events is None or farming_technique is None or 
            typhoon is None or flood is None):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Calculate predicted production (only uses: salinity, farming_technique, typhoon, flood)
        predicted_production = calculate_oyster_production(
            float(salinity),
            int(farming_technique),
            int(typhoon),
            int(flood)
        )
        
        # Get AI recommendations (uses all fields for context)
        recommendations = get_ai_recommendations(
            float(salinity),
            float(temperature),
            int(storms),
            int(severe_events),
            int(farming_technique),
            int(typhoon),
            int(flood),
            predicted_production
        )
        
        return jsonify({
            "success": True,
            "predicted_production": predicted_production,
            "recommendations": recommendations
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, images, etc.)"""
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

