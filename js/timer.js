class Timer {
    constructor(config) {
        this.timeText = config.display;
        this.progressBar = config.progress;
        this.onComplete = config.onComplete;
        this.duration = config.duration || 25 * 60; // Default 25 minutes
        this.remaining = this.duration;
        this.isRunning = false;
        this.updateDisplay();
    }

    setDuration(seconds) {
        if (!this.isRunning) {
            this.duration = seconds;
            this.remaining = seconds;
            this.updateDisplay();
            if (this.progressBar) {
                this.progressBar.style.width = '0%';
            }
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.interval = setInterval(() => this.tick(), 1000);
        }
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.interval);
    }

    reset() {
        this.pause();
        this.remaining = this.duration;
        this.updateDisplay();
        this.updateProgress();
    }

    tick() {
        if (this.remaining > 0) {
            this.remaining--;
            this.updateDisplay();
            this.updateProgress();
        } else {
            this.complete();
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;
        this.timeText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateProgress() {
        const progress = ((this.duration - this.remaining) / this.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    complete() {
        this.pause();
        if (this.onComplete) {
            this.onComplete();
        }
    }

    setMode(isWorkMode) {
        if (!this.isRunning) {
            const minutes = isWorkMode ? 25 : 5;
            this.setDuration(minutes);
        }
    }
} 