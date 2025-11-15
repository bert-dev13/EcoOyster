# How to Set Up EcoOyster

Quick guide to get EcoOyster running on your computer.

---

## What You Need

- Python 3.7 or higher
- Internet connection (for AI recommendations)

**Check Python:** Open terminal/command prompt and type `python --version` (or `python3 --version` on Mac/Linux)

---

## Step 1: Open Project Folder

Open terminal/command prompt and go to your project folder:

**Windows:**
```
cd C:\projects\EcoOyster
```

**Mac/Linux:**
```
cd ~/Desktop/EcoOyster
```

---

## Step 2: Create Virtual Environment

**Windows:**
```
python -m venv venv
```

**Mac/Linux:**
```
python3 -m venv venv
```

---

## Step 3: Activate Virtual Environment

**Windows:**
```
venv\Scripts\activate
```

**Mac/Linux:**
```
source venv/bin/activate
```

You should see `(venv)` at the start of your command line.

---

## Step 4: Install Packages

**Windows:**
```
pip install -r requirements.txt
```

**Mac/Linux:**
```
pip3 install -r requirements.txt
```

Wait for installation to finish.

**What gets installed:**
- Flask (web framework)
- flask-cors (allows cross-origin requests)
- together (AI API for recommendations)

---

## Step 5: Run the Server

**Windows:**
```
python app.py
```

**Mac/Linux:**
```
python3 app.py
```

You should see:
```
============================================================
EcoOyster Server Starting...
============================================================
Server running at: http://127.0.0.1:5000
Press CTRL+C to quit
============================================================
```

**Keep the terminal window open** - the server needs to keep running.

---

## Step 6: Open in Browser

1. Open your web browser
2. Go to: `http://localhost:5000`
3. The EcoOyster website should appear!

---

## Using EcoOyster

1. **Enter Data:** Fill in the 4 input fields:
   - Salinity (ppt)
   - Farming Technique (Raft, Stake, or Both)
   - Number of Typhoons
   - Number of Floods

2. **Calculate:** Click "Compute Oyster Production"

3. **View Results:** See predicted oyster production, farming technique, and AI recommendations

4. **Export:** Download PDF or copy results to clipboard

---

## Troubleshooting

**Problem: "Python not found"**
- Make sure Python is installed: https://www.python.org/downloads/
- Check if you need to use `python3` instead of `python`

**Problem: "pip not found"**
- Make sure pip is installed with Python
- Try `python -m pip` instead of just `pip`

**Problem: "Port 5000 already in use"**
- Another program is using port 5000
- Close other programs or change the port in `app.py`

**Problem: "AI recommendations not loading"**
- Check your internet connection
- Make sure the server is running
- Check browser console for errors (F12)
- Verify the Together AI API key is correct in `app.py`

**Problem: "Module not found"**
- Make sure virtual environment is activated
- Reinstall packages: `pip install -r requirements.txt`

**Problem: "Together AI API error"**
- Check your internet connection
- Verify the API key in `app.py` is valid
- Check if the Together AI service is available

---

## Stopping the Server

To stop the server:
1. Go to the terminal window where it's running
2. Press `CTRL + C` (or `CMD + C` on Mac)
3. To deactivate virtual environment, type: `deactivate`

---

## Configuration

### API Key Configuration

The Together AI API key is configured in `app.py`. You can:

1. **Use the default key** (already set in the code)
2. **Set environment variable:**
   - Windows: `set TOGETHER_API_KEY=your_key_here`
   - Mac/Linux: `export TOGETHER_API_KEY=your_key_here`
3. **Modify directly in app.py** (not recommended for production)

### Changing the Port

To run on a different port, edit `app.py` and change:
```python
app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)
```
Change `port=5000` to your desired port number.

---

## Next Steps

- Read `HOW_IT_WORKSOYSTER.md` to understand the calculations
- Read `AI_RECOMMENDATIONSOYSTER.md` to understand how AI recommendations work
- Start predicting oyster production and getting optimization recommendations!

---

## File Structure

```
EcoOyster/
├── app.py                    # Backend Flask server
├── index.html               # Frontend HTML
├── style.css                # Frontend styles
├── script.js                # Frontend JavaScript
├── requirements.txt         # Python dependencies
├── HOW_IT_WORKSOYSTER.md    # How the system works
├── AI_RECOMMENDATIONSOYSTER.md  # How AI recommendations work
└── SETUPOYSTER.md           # This file
```

---

That's it! You're ready to use EcoOyster! 🎉

