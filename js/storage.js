class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'holdoff_sessions';
    }

    getSessions() {
        const sessions = localStorage.getItem(this.STORAGE_KEY);
        return sessions ? JSON.parse(sessions) : [];
    }

    saveSession(session) {
        const sessions = this.getSessions();
        sessions.push(session);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    }

    getStreak() {
        const sessions = this.getSessions();
        if (sessions.length === 0) return 0;

        let streak = 0;
        const today = new Date().toDateString();
        
        for (let i = sessions.length - 1; i >= 0; i--) {
            const sessionDate = new Date(sessions[i].timestamp).toDateString();
            if (sessionDate === today) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }
} 