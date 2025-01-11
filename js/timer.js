class Timer {
    constructor(display, progressBar, onComplete) {
        this.display = display;
        this.timeText = document.createElement('span');
        this.timeText.className = 'time-text';
        this.display.insertBefore(this.timeText, this.display.firstChild);
        this.progressBar = progressBar;
        this.onComplete = onComplete;
        this.duration = 25 * 60;
        this.remaining = this.duration;
        this.isRunning = false;
        this.updateDisplay();
    }

    setDuration(minutes) {
        if (this.isRunning) return;
        this.duration = minutes * 60;
        this.remaining = this.duration;
        this.updateDisplay();
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
} 