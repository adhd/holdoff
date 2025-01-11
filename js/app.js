class App {
    constructor() {
        this.storage = new StorageManager();
        this.selectedDistractions = new Map();
        this.initializeTheme();
        this.initializeElements();
        this.initializeTimer();
        this.bindEvents();
        this.updateHistory();
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggle(savedTheme);
    }

    updateThemeToggle(theme) {
        const toggle = document.querySelector('.theme-toggle');
        const icon = toggle.querySelector('.theme-icon');
        const text = toggle.querySelector('.theme-text');
        
        if (theme === 'dark') {
            icon.textContent = '🌙';
            text.textContent = 'Dark';
        } else {
            icon.textContent = '☀️';
            text.textContent = 'Light';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeToggle(newTheme);
    }

    initializeElements() {
        this.distractionSelect = document.getElementById('distraction-select');
        this.selectedDistractionsContainer = document.querySelector('.selected-distractions');
        this.timerDisplay = document.querySelector('.timer-display');
        this.progressBar = document.querySelector('.progress');
        this.startButton = document.getElementById('start');
        this.pauseButton = document.getElementById('pause');
        this.resetButton = document.getElementById('reset');
        this.historyList = document.querySelector('.history-list');
        
        // Create time input element separately
        const timeInput = document.createElement('div');
        timeInput.className = 'time-input';
        timeInput.innerHTML = `
            <input type="text" placeholder="25:00" value="25:00">
            <small>Format: mm:ss or minutes</small>
        `;
        this.timerDisplay.appendChild(timeInput);
    }

    initializeTimer() {
        this.timer = new Timer(
            this.timerDisplay,
            this.progressBar,
            () => this.handleTimerComplete()
        );
    }

    bindEvents() {
        this.distractionSelect.addEventListener('change', () => this.handleDistractionSelect());
        this.startButton.addEventListener('click', () => this.startTimer());
        this.pauseButton.addEventListener('click', () => this.pauseTimer());
        this.resetButton.addEventListener('click', () => this.resetTimer());
        this.timerDisplay.addEventListener('click', (e) => {
            if (this.timer.isRunning) return;
            
            const input = this.timerDisplay.querySelector('.time-input');
            const wasVisible = input.classList.contains('visible');
            
            if (e.target.tagName === 'INPUT') {
                e.stopPropagation();
                return;
            }
            
            input.classList.toggle('visible', !wasVisible);
            if (!wasVisible) {
                const inputEl = input.querySelector('input');
                inputEl.value = this.formatTimeInput(this.timer.duration / 60);
                inputEl.focus();
                inputEl.select();
            }
        });
        
        this.timerDisplay.querySelector('input').addEventListener('change', (e) => {
            const timeValue = this.parseTimeInput(e.target.value);
            if (timeValue !== null && timeValue > 0 && timeValue <= 43200) { // 12 hours in seconds
                this.timer.setDuration(timeValue / 60);
                this.timerDisplay.querySelector('.time-input').classList.remove('visible');
            } else {
                e.target.value = this.formatTimeInput(25);
            }
        });
        
        // Also handle Enter key
        this.timerDisplay.querySelector('input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.target.blur(); // Trigger the change event
            }
        });
        
        // Close time selector when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.timerDisplay.contains(e.target)) {
                this.timerDisplay.querySelector('.time-input').classList.remove('visible');
            }
        });

        document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());
    }

    handleDistractionSelect() {
        const selected = this.distractionSelect.value;
        if (!selected) return;

        if (selected === 'custom') {
            const custom = prompt('Enter custom distraction:');
            if (custom && custom.trim()) {
                this.addDistraction(custom.trim(), null);
            }
        } else {
            const selectedOption = this.distractionSelect.options[this.distractionSelect.selectedIndex];
            this.addDistraction(
                selectedOption.text,
                selectedOption.dataset.icon
            );
        }

        this.distractionSelect.value = '';

        const visibleOptions = Array.from(this.distractionSelect.options)
            .filter(opt => opt.style.display !== 'none' && opt.value !== '' && opt.value !== 'custom');

        if (visibleOptions.length === 0) {
            this.distractionSelect.querySelector('option[value=""]').text = 'No more distractions available';
        }
    }

    addDistraction(distraction, iconPath) {
        if (this.selectedDistractions.has(distraction)) return;

        this.selectedDistractions.set(distraction, iconPath);
        const tag = document.createElement('div');
        tag.className = 'distraction-tag';
        tag.dataset.distraction = distraction;
        tag.innerHTML = `${
            iconPath ? `<img src="${iconPath}" alt="${distraction} icon">` : ''
        }${distraction}<button onclick="app.removeDistraction('${distraction}')">&times;</button>`;
        this.selectedDistractionsContainer.appendChild(tag);

        const option = Array.from(this.distractionSelect.options).find(opt => 
            opt.text === distraction || opt.value === distraction.toLowerCase().replace(/\s+/g, '-')
        );
        if (option) {
            option.style.display = 'none';
        }
    }

    removeDistraction(distraction) {
        this.selectedDistractions.delete(distraction);
        const tagToRemove = this.selectedDistractionsContainer.querySelector(`[data-distraction="${distraction}"]`);
        if (tagToRemove) {
            tagToRemove.remove();
        }

        const option = Array.from(this.distractionSelect.options).find(opt => 
            opt.text === distraction || opt.value === distraction.toLowerCase().replace(/\s+/g, '-')
        );
        if (option) {
            option.style.display = '';
        }

        if (this.selectedDistractions.size < this.distractionSelect.options.length - 2) { // -2 for default and custom options
            this.distractionSelect.querySelector('option[value=""]').text = 'Choose a distraction...';
        }
    }

    startTimer() {
        if (this.selectedDistractions.size === 0) {
            alert('Please select at least one distraction to stay away from');
            return;
        }

        this.timer.start();
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        this.resetButton.disabled = false;
    }

    pauseTimer() {
        this.timer.pause();
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
    }

    resetTimer() {
        this.timer.reset();
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.resetButton.disabled = true;
    }

    handleTimerComplete() {
        const session = {
            timestamp: new Date().toISOString(),
            distractions: Array.from(this.selectedDistractions.keys())
        };
        
        this.storage.saveSession(session);
        this.updateHistory();
        
        const duration = this.formatTimeForMessage(this.timer.duration);
        alert(`Great job! You've stayed away from ${Array.from(this.selectedDistractions.keys()).join(', ')} for ${duration}!`);
        
        this.resetTimer();
    }

    formatTimeForMessage(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        
        if (minutes === 0) {
            return `${remainingSeconds} seconds`;
        } else if (minutes === 1) {
            return remainingSeconds > 0 ? `1 minute and ${remainingSeconds} seconds` : '1 minute';
        } else {
            return remainingSeconds > 0 ? `${minutes} minutes and ${remainingSeconds} seconds` : `${minutes} minutes`;
        }
    }

    updateHistory() {
        const sessions = this.storage.getSessions();
        const streak = this.storage.getStreak();
        
        this.historyList.innerHTML = `
            <h2>
                Recent Sessions
                <span class="streak-count">${streak} streaks today</span>
            </h2>
            ${sessions.slice(-5).reverse().map(session => `
                <div class="history-entry">
                    <p>${this.formatTimestamp(new Date(session.timestamp))}</p>
                    <p>${session.distractions.join(', ')}</p>
                </div>
            `).join('')}
        `;
    }

    formatTimestamp(date) {
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    formatTimeInput(minutes) {
        const mins = Math.floor(minutes);
        const secs = Math.round((minutes % 1) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    parseTimeInput(value) {
        // Handle mm:ss format
        if (value.includes(':')) {
            const [mins, secs] = value.split(':').map(v => parseInt(v));
            if (!isNaN(mins) && !isNaN(secs) && secs < 60) {
                return mins * 60 + secs;
            }
        }
        // Handle minutes as number
        const minutes = parseFloat(value);
        if (!isNaN(minutes)) {
            return minutes * 60;
        }
        return null;
    }
}

// Initialize the app
const app = new App(); 