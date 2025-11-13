# Oyster Production Prediction System

A web-based system that predicts oyster production based on environmental and farming factors and provides AI-powered recommendations to maximize yield.

## Features

- **Production Prediction**: Calculates predicted oyster production using the formula:
  ```
  Oyster Production = 0.268(Salinity) + 0.567(Farming Technique) + 0.436(Typhoon) + 0.223(Flood) - 4.595
  ```

- **AI-Powered Recommendations**: Uses Together API (DeepSeek) to generate smart farming interventions

- **Modern UI**: Clean, responsive design matching the EcoDengue system style

## Requirements

- Python 3.7+
- Flask
- Together API key

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure you have a valid Together API key (already configured in `app.py`)

## Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

## Input Fields

- **Salinity (ppt)**: Salinity level of the water (numeric, e.g., 15.02)
- **Farming Technique**: 
  - 1 = Raft method
  - 2 = Stake method
  - 3 = Both Raft and Stake
- **Typhoon**: Checkbox indicating if the area was affected by a typhoon (0 = No, 1 = Yes)
- **Flood**: Checkbox indicating if the area was affected by flooding (0 = No, 1 = Yes)

## API Endpoints

- `GET /`: Main page
- `POST /api/predict`: Predicts oyster production and returns AI recommendations
  - Request body: `{ "salinity": 15.02, "farming_technique": 1, "typhoon": 0, "flood": 0 }`
  - Response: `{ "success": true, "predicted_production": 1.66, "recommendations": "..." }`
- `GET /api/health`: Health check endpoint

## Project Structure

```
EcoOyster/
├── app.py              # Flask backend
├── index.html          # Frontend HTML
├── style.css           # Styling
├── script.js           # Frontend JavaScript
├── requirements.txt    # Python dependencies
└── assets/
    └── images/
        └── logo.png    # Logo image
```

## Notes

- The system uses the same UI/UX design as the EcoDengue project
- AI recommendations are generated using DeepSeek-R1-Distill-Llama-70B-free model
- Production values are displayed in metric tons

