class AuthManager {
    constructor() {
        this.token = null;
        this.user = null;
        this.baseURL = `${window.location.origin}/api`;
        this.init();
    }

    init() {
        this.loadStoredAuth();
    }

    loadStoredAuth() {
        this.token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (userData) {
            this.user = JSON.parse(userData);
        }

        if (!this.token || !this.user) {
            this.clearAuth();
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();

            if (response.ok) {
                this.token = data.access_token;
                this.user = data.user;
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('user_data', JSON.stringify(this.user));
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Erro de conexão com o servidor' };
        }
    }

    async register(username, email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Erro de conexão com o servidor' };
        }
    }

    isLoggedIn() {
        return !!(this.token && this.user);
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }

    logout() {
        this.clearAuth();
    }
}

window.authManager = new AuthManager();