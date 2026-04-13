# Galicia Weather Game 🌧️☀️

A humorous Galicia-themed real-time weather management game built with plain HTML, CSS, and JavaScript.

## How to Run

Simply open `index.html` in any modern web browser:

```bash
# Option 1: Open directly in your default browser
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows

# Option 2: Use a local server (recommended)
python3 -m http.server 8000
# Then navigate to http://localhost:8000
```

## Gameplay

### Objective
Manage your characters through unpredictable Galician weather (sudden rain and sun) by toggling umbrellas strategically. Keep them alive and walking to earn points!

### Characters
- **European characters** (blue): From Eastern Europe, arrive by train (bottom left)
- **Moroccan characters** (brown/orange): From Morocco, arrive by boat (bottom right)

### Weather Rules

**During Rain:**
- European characters can ONLY walk if they have an umbrella open
- Moroccan characters FREEZE if they have an umbrella open
- Without umbrella: Moroccan loses 2 HP/sec, European loses 1 HP/sec

**During Sun:**
- European characters CANNOT walk if they have an umbrella open
- Moroccan characters behave normally (can always walk)
- Without umbrella: Moroccan gains 3 HP/sec, European gains 2 HP/sec
- With umbrella: Moroccan loses 1 HP/sec, European gains 0 HP/sec

### Controls
- **Click on a character** to toggle their umbrella
- **Take button** (bottom corners): Spend 50 points to bring a new character when score > 60

### Scoring
- +1 point per second for each walking character
- Frozen or non-moving characters don't generate points

### Special Features
- **Octopus Bonus**: When score reaches 200, an octopus appears as a Galicia economy bonus (costs 100 points)
- **Emigration**: When HP reaches zero, the character "Emigrates to Argentina"

## Files Structure

```
/workspace
├── index.html    # Main HTML structure
├── styles.css    # All visual styles
├── game.js       # Game logic and mechanics
└── README.md     # This file
```

## Configuration

All game parameters are easily configurable in `game.js` under the `CONFIG` object:
- Weather timing durations
- HP rates for different conditions
- Movement speed and spacing
- Scoring thresholds and costs

Enjoy managing your Galician weather chaos! 🐙
