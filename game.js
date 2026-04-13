/**
 * Galicia Weather Game
 * A humorous real-time weather management game set in Galicia
 */

// ============================================
// CONFIGURATION - Easy to tweak values
// ============================================
const CONFIG = {
    // Weather timing (in seconds)
    WEATHER: {
        RAIN_MIN_DURATION: 3,
        RAIN_MAX_DURATION: 12,
        SUN_MIN_DURATION: 5,
        SUN_MAX_DURATION: 15
    },
    
    // HP rates (per second)
    HP_RATES: {
        // During rain
        RAIN_MOROCCAN_NO_UMBRELLA: -2,
        RAIN_EUROPEAN_NO_UMBRELLA: -1,
        // During sun
        SUN_MOROCCAN_NO_UMBRELLA: 3,
        SUN_MOROCCAN_WITH_UMBRELLA: -1,
        SUN_EUROPEAN_NO_UMBRELLA: 2,
        SUN_EUROPEAN_WITH_UMBRELLA: 0
    },
    
    // Movement
    MOVEMENT: {
        SPEED: 30, // pixels per second
        MIN_SPACING: 60, // minimum distance between characters in pixels
        BOUNCE_MARGIN: 60 // margin from edges
    },
    
    // Scoring
    SCORING: {
        POINTS_PER_WALKING_CHAR: 1, // points per second
        NEW_ARRIVAL_THRESHOLD: 60,
        NEW_ARRIVAL_COST: 50,
        OCTOPUS_THRESHOLD: 200,
        OCTOPUS_COST: 100
    },
    
    // Character starting HP
    CHARACTER: {
        MAX_HP: 100,
        STARTING_HP: 100
    }
};

// ============================================
// GAME STATE
// ============================================
const GameState = {
    isRunning: false,
    score: 0,
    weather: 'sun', // 'sun' or 'rain'
    weatherTimeoutId: null,
    characters: [],
    characterIdCounter: 0,
    waitingEurope: null,
    waitingMorocco: null,
    octopusUnlocked: false,
    lastUpdateTime: null,
    animationFrameId: null
};

// ============================================
// DOM ELEMENTS
// ============================================
let elements = {};

function cacheElements() {
    elements = {
        gameField: document.getElementById('game-field'),
        scoreValue: document.getElementById('score-value'),
        startBtn: document.getElementById('start-btn'),
        endBtn: document.getElementById('end-btn'),
        weatherSun: document.getElementById('weather-sun'),
        weatherRain: document.getElementById('weather-rain'),
        charactersContainer: document.getElementById('characters-container'),
        arrivalEurope: document.getElementById('arrival-europe'),
        arrivalMorocco: document.getElementById('arrival-morocco'),
        europeWaiting: document.getElementById('europe-waiting'),
        moroccoWaiting: document.getElementById('morocco-waiting'),
        takeEuropeBtn: document.getElementById('take-europe-btn'),
        takeMoroccoBtn: document.getElementById('take-morocco-btn'),
        octopus: document.getElementById('octopus'),
        emigrationMessage: document.getElementById('emigration-message')
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// ============================================
// WEATHER SYSTEM
// ============================================
function scheduleWeatherChange() {
    if (!GameState.isRunning) return;
    
    const currentWeather = GameState.weather;
    let duration;
    
    if (currentWeather === 'rain') {
        // Switch to sun
        duration = randomRange(CONFIG.WEATHER.SUN_MIN_DURATION, CONFIG.WEATHER.SUN_MAX_DURATION) * 1000;
    } else {
        // Switch to rain
        duration = randomRange(CONFIG.WEATHER.RAIN_MIN_DURATION, CONFIG.WEATHER.RAIN_MAX_DURATION) * 1000;
    }
    
    GameState.weatherTimeoutId = setTimeout(() => {
        if (!GameState.isRunning) return;
        
        // Change weather abruptly
        GameState.weather = currentWeather === 'rain' ? 'sun' : 'rain';
        updateWeatherDisplay();
        
        // Schedule next change
        scheduleWeatherChange();
    }, duration);
}

function updateWeatherDisplay() {
    if (GameState.weather === 'sun') {
        elements.weatherSun.classList.remove('hidden');
        elements.weatherRain.classList.add('hidden');
    } else {
        elements.weatherSun.classList.add('hidden');
        elements.weatherRain.classList.remove('hidden');
    }
}

// ============================================
// CHARACTER CLASS
// ============================================
class Character {
    constructor(type, startX, startY) {
        this.id = ++GameState.characterIdCounter;
        this.type = type; // 'european' or 'moroccan'
        this.x = startX;
        this.y = startY;
        this.hp = CONFIG.CHARACTER.STARTING_HP;
        this.hasUmbrella = false;
        this.isFrozen = false;
        this.velocityX = randomRange(-1, 1);
        this.velocityY = randomRange(-1, 1);
        this.element = null;
        this.createDOMElement();
    }
    
    createDOMElement() {
        const charDiv = document.createElement('div');
        charDiv.className = `character ${this.type}`;
        charDiv.id = `character-${this.id}`;
        
        // HP value display
        const hpValue = document.createElement('div');
        hpValue.className = 'hp-value';
        hpValue.textContent = this.hp;
        
        // HP bar container
        const hpBarContainer = document.createElement('div');
        hpBarContainer.className = 'hp-bar-container';
        
        const hpBarFill = document.createElement('div');
        hpBarFill.className = 'hp-bar-fill';
        hpBarFill.style.width = '100%';
        
        hpBarContainer.appendChild(hpBarFill);
        
        // Umbrella
        const umbrella = document.createElement('div');
        umbrella.className = 'umbrella';
        umbrella.style.display = 'none';
        
        // Head
        const head = document.createElement('div');
        head.className = 'character-head';
        
        // Body
        const body = document.createElement('div');
        body.className = 'character-body';
        
        // Assemble
        charDiv.appendChild(hpValue);
        charDiv.appendChild(hpBarContainer);
        charDiv.appendChild(umbrella);
        charDiv.appendChild(head);
        charDiv.appendChild(body);
        
        // Click handler for umbrella toggle
        charDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUmbrella();
        });
        
        elements.charactersContainer.appendChild(charDiv);
        this.element = charDiv;
        this.updatePosition();
    }
    
    toggleUmbrella() {
        if (!GameState.isRunning) return;
        this.hasUmbrella = !this.hasUmbrella;
        this.updateUmbrellaDisplay();
    }
    
    updateUmbrellaDisplay() {
        const umbrella = this.element.querySelector('.umbrella');
        umbrella.style.display = this.hasUmbrella ? 'block' : 'none';
    }
    
    updateHPDisplay() {
        const hpBarFill = this.element.querySelector('.hp-bar-fill');
        const hpValue = this.element.querySelector('.hp-value');
        
        const hpPercent = Math.max(0, (this.hp / CONFIG.CHARACTER.MAX_HP) * 100);
        hpBarFill.style.width = `${hpPercent}%`;
        hpValue.textContent = Math.max(0, Math.floor(this.hp));
    }
    
    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
    
    updateFrozenState() {
        if (this.isFrozen) {
            this.element.classList.add('frozen');
        } else {
            this.element.classList.remove('frozen');
        }
    }
    
    canWalk() {
        // Movement restrictions based on weather and umbrella
        if (GameState.weather === 'rain') {
            // During rain: European can walk only with umbrella, Moroccan freezes with umbrella
            if (this.type === 'european') {
                return this.hasUmbrella;
            } else {
                // Moroccan
                return !this.hasUmbrella;
            }
        } else {
            // During sun
            if (this.type === 'european') {
                // European cannot walk with umbrella
                return !this.hasUmbrella;
            } else {
                // Moroccan behaves normally (can always walk)
                return true;
            }
        }
    }
    
    applyHealthChange(deltaTime) {
        let hpChange = 0;
        
        if (GameState.weather === 'rain') {
            if (this.type === 'moroccan' && !this.hasUmbrella) {
                hpChange = CONFIG.HP_RATES.RAIN_MOROCCAN_NO_UMBRELLA * deltaTime;
            } else if (this.type === 'european' && !this.hasUmbrella) {
                hpChange = CONFIG.HP_RATES.RAIN_EUROPEAN_NO_UMBRELLA * deltaTime;
            }
            // If they have umbrella during rain, no HP change
        } else {
            // Sun
            if (this.type === 'moroccan') {
                if (this.hasUmbrella) {
                    hpChange = CONFIG.HP_RATES.SUN_MOROCCAN_WITH_UMBRELLA * deltaTime;
                } else {
                    hpChange = CONFIG.HP_RATES.SUN_MOROCCAN_NO_UMBRELLA * deltaTime;
                }
            } else {
                // European
                if (this.hasUmbrella) {
                    hpChange = CONFIG.HP_RATES.SUN_EUROPEAN_WITH_UMBRELLA * deltaTime;
                } else {
                    hpChange = CONFIG.HP_RATES.SUN_EUROPEAN_NO_UMBRELLA * deltaTime;
                }
            }
        }
        
        this.hp += hpChange;
        this.hp = Math.min(this.hp, CONFIG.CHARACTER.MAX_HP);
    }
    
    move(deltaTime, allCharacters) {
        if (!this.canWalk()) {
            this.isFrozen = true;
            this.updateFrozenState();
            return;
        }
        
        this.isFrozen = false;
        this.updateFrozenState();
        
        // Normalize velocity
        const speed = CONFIG.MOVEMENT.SPEED;
        const mag = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (mag > 0) {
            this.velocityX = (this.velocityX / mag) * speed;
            this.velocityY = (this.velocityY / mag) * speed;
        }
        
        // Calculate new position
        let newX = this.x + this.velocityX * deltaTime;
        let newY = this.y + this.velocityY * deltaTime;
        
        // Boundary checking
        const fieldWidth = elements.gameField.clientWidth;
        const fieldHeight = elements.gameField.clientHeight;
        const margin = CONFIG.MOVEMENT.BOUNCE_MARGIN;
        
        if (newX < margin || newX > fieldWidth - margin - 50) {
            this.velocityX *= -1;
            newX = Math.max(margin, Math.min(newX, fieldWidth - margin - 50));
        }
        
        if (newY < margin || newY > fieldHeight - margin - 70) {
            this.velocityY *= -1;
            newY = Math.max(margin, Math.min(newY, fieldHeight - margin - 70));
        }
        
        // Collision avoidance with other characters
        for (const other of allCharacters) {
            if (other.id !== this.id) {
                const dist = getDistance(newX, newY, other.x, other.y);
                const minSpacing = CONFIG.MOVEMENT.MIN_SPACING;
                
                if (dist < minSpacing) {
                    // Push away from other character
                    const pushX = newX - other.x;
                    const pushY = newY - other.y;
                    const pushMag = Math.sqrt(pushX * pushX + pushY * pushY);
                    
                    if (pushMag > 0) {
                        const pushFactor = (minSpacing - dist) / pushMag;
                        newX += pushX * pushFactor * 0.5;
                        newY += pushY * pushFactor * 0.5;
                        
                        // Also adjust velocity to avoid future collisions
                        this.velocityX += pushX * 0.1;
                        this.velocityY += pushY * 0.1;
                    }
                }
            }
        }
        
        this.x = newX;
        this.y = newY;
        this.updatePosition();
    }
    
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// ============================================
// SPAWNING CHARACTERS
// ============================================
function spawnCharacter(type) {
    const fieldWidth = elements.gameField.clientWidth;
    const fieldHeight = elements.gameField.clientHeight;
    const margin = CONFIG.MOVEMENT.BOUNCE_MARGIN;
    
    // Find a valid spawn position that doesn't overlap with existing characters
    let attempts = 0;
    let x, y;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        x = randomRange(margin, fieldWidth - margin - 50);
        y = randomRange(margin + 100, fieldHeight - margin - 70); // Keep away from weather display
        
        // Check if position is valid (no overlap with existing characters)
        let isValid = true;
        for (const char of GameState.characters) {
            if (getDistance(x, y, char.x, char.y) < CONFIG.MOVEMENT.MIN_SPACING) {
                isValid = false;
                break;
            }
        }
        
        if (isValid) break;
        attempts++;
    }
    
    const character = new Character(type, x, y);
    GameState.characters.push(character);
    return character;
}

// ============================================
// ARRIVAL SYSTEM
// ============================================
function checkArrivals() {
    if (GameState.score >= CONFIG.SCORING.NEW_ARRIVAL_THRESHOLD) {
        // Spawn waiting characters if not already present
        if (!GameState.waitingEurope) {
            GameState.waitingEurope = true;
            elements.europeWaiting.textContent = '🚶';
            elements.europeWaiting.classList.remove('hidden');
            elements.takeEuropeBtn.classList.remove('hidden');
        }
        
        if (!GameState.waitingMorocco) {
            GameState.waitingMorocco = true;
            elements.moroccoWaiting.textContent = '🚶';
            elements.moroccoWaiting.classList.remove('hidden');
            elements.takeMoroccoBtn.classList.remove('hidden');
        }
    }
}

function takeCharacter(type) {
    if (GameState.score < CONFIG.SCORING.NEW_ARRIVAL_COST) return;
    
    GameState.score -= CONFIG.SCORING.NEW_ARRIVAL_COST;
    updateScoreDisplay();
    
    spawnCharacter(type);
    
    // Clear waiting state
    if (type === 'european') {
        GameState.waitingEurope = null;
        elements.europeWaiting.classList.add('hidden');
        elements.takeEuropeBtn.classList.add('hidden');
    } else {
        GameState.waitingMorocco = null;
        elements.moroccoWaiting.classList.add('hidden');
        elements.takeMoroccoBtn.classList.add('hidden');
    }
}

// ============================================
// OCTOPUS ECONOMY BONUS
// ============================================
function checkOctopusUnlock() {
    if (GameState.octopusUnlocked) return;
    
    if (GameState.score >= CONFIG.SCORING.OCTOPUS_THRESHOLD) {
        GameState.score -= CONFIG.SCORING.OCTOPUS_COST;
        GameState.octopusUnlocked = true;
        elements.octopus.classList.remove('hidden');
        updateScoreDisplay();
    }
}

// ============================================
// SCORING AND UI
// ============================================
function updateScoreDisplay() {
    elements.scoreValue.textContent = Math.floor(GameState.score);
}

function showEmigrationMessage() {
    elements.emigrationMessage.classList.remove('hidden');
    
    // Hide after animation completes
    setTimeout(() => {
        elements.emigrationMessage.classList.add('hidden');
    }, 2000);
}

// ============================================
// GAME LOOP
// ============================================
function gameLoop(currentTime) {
    if (!GameState.isRunning) return;
    
    // Calculate delta time in seconds
    if (!GameState.lastUpdateTime) {
        GameState.lastUpdateTime = currentTime;
    }
    
    const deltaTime = (currentTime - GameState.lastUpdateTime) / 1000;
    GameState.lastUpdateTime = currentTime;
    
    // Update each character
    let walkingCount = 0;
    
    for (const character of GameState.characters) {
        // Apply health changes
        character.applyHealthChange(deltaTime);
        character.updateHPDisplay();
        
        // Check for death
        if (character.hp <= 0) {
            showEmigrationMessage();
            character.remove();
            // Mark for removal
            character.markedForRemoval = true;
        } else {
            // Move character
            character.move(deltaTime, GameState.characters);
            
            // Count walking characters for scoring
            if (character.canWalk() && !character.isFrozen) {
                walkingCount++;
            }
        }
    }
    
    // Remove dead characters
    GameState.characters = GameState.characters.filter(c => !c.markedForRemoval);
    
    // Add score for walking characters
    if (walkingCount > 0) {
        GameState.score += CONFIG.SCORING.POINTS_PER_WALKING_CHAR * walkingCount * deltaTime;
        updateScoreDisplay();
    }
    
    // Check for arrivals and octopus
    checkArrivals();
    checkOctopusUnlock();
    
    // Continue loop
    GameState.animationFrameId = requestAnimationFrame(gameLoop);
}

// ============================================
// GAME CONTROL
// ============================================
function startGame() {
    if (GameState.isRunning) return;
    
    GameState.isRunning = true;
    GameState.score = 0;
    GameState.weather = 'sun';
    GameState.characters = [];
    GameState.characterIdCounter = 0;
    GameState.waitingEurope = null;
    GameState.waitingMorocco = null;
    GameState.octopusUnlocked = false;
    GameState.lastUpdateTime = null;
    
    updateScoreDisplay();
    updateWeatherDisplay();
    
    // Spawn initial characters (one of each type)
    spawnCharacter('european');
    spawnCharacter('moroccan');
    
    // Start weather cycle
    scheduleWeatherChange();
    
    // Start game loop
    GameState.animationFrameId = requestAnimationFrame(gameLoop);
    
    elements.startBtn.disabled = true;
    elements.startBtn.style.opacity = '0.5';
}

function endGame() {
    if (!GameState.isRunning) return;
    
    GameState.isRunning = false;
    
    // Clear timeouts
    if (GameState.weatherTimeoutId) {
        clearTimeout(GameState.weatherTimeoutId);
        GameState.weatherTimeoutId = null;
    }
    
    // Cancel animation frame
    if (GameState.animationFrameId) {
        cancelAnimationFrame(GameState.animationFrameId);
        GameState.animationFrameId = null;
    }
    
    // Remove all characters
    for (const character of GameState.characters) {
        character.remove();
    }
    GameState.characters = [];
    
    // Reset UI
    elements.europeWaiting.classList.add('hidden');
    elements.moroccoWaiting.classList.add('hidden');
    elements.takeEuropeBtn.classList.add('hidden');
    elements.takeMoroccoBtn.classList.add('hidden');
    elements.octopus.classList.add('hidden');
    
    elements.startBtn.disabled = false;
    elements.startBtn.style.opacity = '1';
    
    // Reset score display
    GameState.score = 0;
    updateScoreDisplay();
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startGame);
    elements.endBtn.addEventListener('click', endGame);
    elements.takeEuropeBtn.addEventListener('click', () => takeCharacter('european'));
    elements.takeMoroccoBtn.addEventListener('click', () => takeCharacter('moroccan'));
    
    // Prevent click propagation on game field
    elements.gameField.addEventListener('click', (e) => {
        // Only if clicking directly on the field, not on characters
        if (e.target === elements.gameField || e.target.classList.contains('hill')) {
            // Do nothing - clicks on field don't affect anything
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    setupEventListeners();
});
