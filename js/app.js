class App {
    constructor() {
        this.isWorkMode = true;
        this.selectedDistractions = new Set();
        this.storageManager = new StorageManager();
        this.initializeTimer();
        this.initializeControls();
        this.initializeDistractionSelector();
        this.loadSavedMode();
        this.initializeThemeToggle();
        this.updateSessionHistory();
    }

    initializeControls() {
        this.startButton = document.getElementById('start');
        this.pauseButton = document.getElementById('pause');
        this.resetButton = document.getElementById('reset');
        this.modeToggle = document.getElementById('mode-toggle');

        this.startButton.addEventListener('click', () => this.startTimer());
        this.pauseButton.addEventListener('click', () => this.timer.pause());
        this.resetButton.addEventListener('click', () => this.timer.reset());
        
        // Add mode toggle handler
        this.modeToggle.addEventListener('click', () => this.toggleMode());
    }

    toggleMode() {
        this.isWorkMode = !this.isWorkMode;
        this.modeToggle.textContent = this.isWorkMode ? 'Work' : 'Rest';
        
        // Reset timer state when switching modes
        this.timer.pause();
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.resetButton.disabled = true;
        
        // Update timer duration
        const minutes = this.isWorkMode ? 25 : 5;
        this.timer.setDuration(minutes * 60);
        
        this.updateModeUI();
        localStorage.setItem('mode', this.isWorkMode ? 'work' : 'rest');
    }

    updateModeUI() {
        const distractionSection = document.querySelector('.distraction-selector');
        
        if (this.isWorkMode) {
            distractionSection.innerHTML = `
                <h2>I'm staying away from:</h2>
                <div class="selected-distractions"></div>
                <select id="distraction-select">
                    <option value="">Choose a distraction...</option>
                    <option value="social-media">Social Media</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="youtube">YouTube</option>
                    <option value="news">News Sites</option>
                    <option value="custom">+ Add Custom</option>
                </select>
            `;
            this.initializeDistractionSelector();
        } else {
            const quotes = [
                "Rest is not idleness, it is the key to greater activity.",
                "Take rest; a field that has rested gives a bountiful crop.",
                "Sometimes the most productive thing you can do is rest.",
                "Rest when you're weary. Refresh and renew yourself.",
            ];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            distractionSection.innerHTML = `
                <h2>Time to Rest</h2>
                <div class="rest-quote">
                    <p>${randomQuote}</p>
                </div>
            `;
        }
    }

    loadSavedMode() {
        const savedMode = localStorage.getItem('mode');
        if (savedMode === 'rest') {
            this.isWorkMode = false;
            this.modeToggle.textContent = 'Rest';
            this.timer.setDuration(5 * 60);
            
            // Reset button states
            this.startButton.disabled = false;
            this.pauseButton.disabled = true;
            this.resetButton.disabled = true;
            
            this.updateModeUI();
        }
    }

    startTimer() {
        // Only check for distractions in work mode
        if (this.isWorkMode && this.selectedDistractions.size === 0) {
            alert('Please select at least one distraction to stay away from');
            return;
        }
        
        this.timer.start();
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        this.resetButton.disabled = false;
    }

    initializeTimer() {
        const timerDisplay = document.querySelector('.timer-display');
        const progressBar = document.querySelector('.progress');
        
        // Create a time text element if it doesn't exist
        if (!timerDisplay.querySelector('.time-text')) {
            const timeText = document.createElement('div');
            timeText.className = 'time-text';
            timerDisplay.appendChild(timeText);
        }

        // Create time input if it doesn't exist
        if (!timerDisplay.querySelector('.time-input')) {
            const timeInput = document.createElement('div');
            timeInput.className = 'time-input';
            timeInput.innerHTML = `
                <input type="text" placeholder="HH:MM:SS" pattern="[0-9:]*">
                <small>Press Enter to save</small>
            `;
            timerDisplay.appendChild(timeInput);
        }

        this.timer = new Timer({
            display: timerDisplay.querySelector('.time-text'),
            progress: progressBar,
            duration: this.isWorkMode ? 25 * 60 : 5 * 60,
            onComplete: () => {
                this.startButton.disabled = false;
                this.pauseButton.disabled = true;
                this.resetButton.disabled = true;

                // Log the completed session
                const session = {
                    timestamp: new Date().toISOString(),
                    duration: this.timer.duration,
                    type: this.isWorkMode ? 'work' : 'rest',
                    distractions: this.isWorkMode ? Array.from(this.selectedDistractions) : []
                };
                
                this.storageManager.saveSession(session);
                this.updateSessionHistory();
            }
        });

        // Add click handler for timer display
        timerDisplay.addEventListener('click', () => {
            if (this.timer.isRunning) return; // Don't allow editing while timer is running
            
            const timeInput = timerDisplay.querySelector('.time-input');
            const input = timeInput.querySelector('input');
            
            timeInput.classList.add('visible');
            
            // Format current duration to HH:MM:SS
            const hours = Math.floor(this.timer.duration / 3600);
            const minutes = Math.floor((this.timer.duration % 3600) / 60);
            const seconds = this.timer.duration % 60;
            input.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            input.focus();
            
            const parseTimeInput = (value) => {
                const parts = value.split(':').map(part => parseInt(part, 10) || 0);
                if (parts.length === 3) {
                    return parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) {
                    return parts[0] * 60 + parts[1];
                } else if (parts.length === 1) {
                    return parts[0];
                }
                return null;
            };

            const handleInput = (e) => {
                if (e.key === 'Enter') {
                    const totalSeconds = parseTimeInput(input.value);
                    if (totalSeconds !== null && totalSeconds > 0) {
                        this.timer.setDuration(totalSeconds);
                        timeInput.classList.remove('visible');
                    }
                    input.removeEventListener('keydown', handleInput);
                } else if (e.key === 'Escape') {
                    timeInput.classList.remove('visible');
                    input.removeEventListener('keydown', handleInput);
                }
            };

            input.addEventListener('keydown', handleInput);
            
            // Close input when clicking outside
            const handleClickOutside = (e) => {
                if (!timeInput.contains(e.target) && !timerDisplay.contains(e.target)) {
                    timeInput.classList.remove('visible');
                    document.removeEventListener('click', handleClickOutside);
                }
            };
            
            // Add slight delay to avoid immediate trigger
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
        });
    }

    initializeThemeToggle() {
        this.themeToggle = document.querySelector('.theme-toggle');
        this.themeIcon = document.querySelector('.theme-icon');
        this.themeText = document.querySelector('.theme-text');
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggle(savedTheme);

        // Add click handler
        this.themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeToggle(newTheme);
        });
    }

    updateThemeToggle(theme) {
        this.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        this.themeText.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }

    initializeDistractionSelector() {
        this.distractionSelect = document.getElementById('distraction-select');
        this.selectedDistractionsContainer = document.querySelector('.selected-distractions');

        this.distractionSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (!value) return;

            if (value === 'custom') {
                const customDistraction = prompt('Enter custom distraction:');
                if (customDistraction && customDistraction.trim()) {
                    this.addDistraction(customDistraction.trim());
                }
            } else {
                const option = e.target.selectedOptions[0];
                this.addDistraction(option.text, value);
            }

            // Reset select to default option
            e.target.value = '';
        });
    }

    addDistraction(text, value = null) {
        if (this.selectedDistractions.has(text)) return;
        
        this.selectedDistractions.add(text);
        
        const tag = document.createElement('div');
        tag.className = 'distraction-tag';
        
        // Add icon if available
        if (value) {
            const icon = document.createElement('img');
            icon.src = `icons/${value}.png`;
            icon.alt = text;
            tag.appendChild(icon);
        }
        
        // Add text
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        tag.appendChild(textSpan);
        
        // Add remove button
        const removeButton = document.createElement('button');
        removeButton.innerHTML = '×';
        removeButton.addEventListener('click', () => {
            this.selectedDistractions.delete(text);
            tag.remove();
        });
        tag.appendChild(removeButton);
        
        this.selectedDistractionsContainer.appendChild(tag);
    }

    updateSessionHistory() {
        const historyList = document.querySelector('.history-list');
        const sessions = this.storageManager.getSessions();
        
        historyList.innerHTML = sessions.slice(-10).reverse().map(session => {
            const date = new Date(session.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const minutes = Math.floor(session.duration / 60);
            
            let description;
            if (session.type === 'work') {
                const distractions = session.distractions.join(', ');
                description = `${minutes}min focus session<br><small>Avoided: ${distractions}</small>`;
            } else {
                description = `${minutes}min rest session`;
            }
            
            return `
                <div class="history-entry">
                    <p>${timeStr}</p>
                    <p>${description}</p>
                </div>
            `;
        }).join('');
    }

    // ... rest of App class methods
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
}); 