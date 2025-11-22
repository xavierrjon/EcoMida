class EcoMidaApp {
    constructor() {
        this.currentScreen = 'login-screen';
        this.currentUser = null;
        this.baseURL = `${window.location.origin}/api`;
        this.auth = null;
        this.init();
    }

    init() {
        this.updateHeaderVisibility(false);

        if (typeof authManager !== 'undefined') {
            this.auth = window.authManager;
        } else {
            setTimeout(() => this.delayedInit(), 200);
            return;
        }
        
        this.setupEventListeners();
        this.checkAuthStatus();
        this.showScreen('login-screen');
    }

    delayedInit() {
        if (typeof authManager !== 'undefined') {
            this.auth = window.authManager;
        }
        
        this.setupEventListeners();
        this.checkAuthStatus();
        this.showScreen('login-screen');
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'show-register') {
                this.showScreen('register-screen');
                return;
            }

            if (e.target.id === 'cancel-register') {
                this.showScreen('login-screen');
                return;
            }

            if (!this.currentUser) {
                return;
            }

            if (e.target.closest('.nav-btn')) {
                const btn = e.target.closest('.nav-btn');
                const screen = btn.getAttribute('data-screen');
                this.showScreen(screen);
                this.updateActiveNav(btn);
            }

            if (e.target.id === 'add-food-btn' || e.target.id === 'add-first-food') {
                this.showScreen('add-food-screen');
            }

            if (e.target.id === 'cancel-add-food') {
                this.showScreen('main-screen');
            }

            if (e.target.classList.contains('category-btn')) {
                this.filterTipsByCategory(e.target);
            }
        });

        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const addFoodForm = document.getElementById('add-food-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        if (addFoodForm) {
            addFoodForm.addEventListener('submit', (e) => this.handleAddFood(e));
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }

        if (screenId === 'login-screen' || screenId === 'register-screen') {
            this.updateHeaderVisibility(false);
        } else {
            this.updateHeaderVisibility(!!this.currentUser);
        }

        this.onScreenShow(screenId);

        setTimeout(() => {
            const header = document.querySelector('.app-header');
            const nav = document.querySelector('.bottom-nav');
            console.log('👀 Header visível?', header.offsetParent !== null);
            console.log('👀 Nav visível?', nav.offsetParent !== null);
        }, 100);
    }

    onScreenShow(screenId) {
        switch(screenId) {
            case 'main-screen':
                this.loadFoods();
                break;
            case 'tips-screen':
                this.loadTips();
                break;
            case 'login-screen':
                this.updateHeaderVisibility(false);
                break;
            default:
                this.updateHeaderVisibility(true);
        }
    }

    updateActiveNav(activeBtn) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    updateHeaderVisibility(show) {
        const header = document.querySelector('.app-header');
        const bottomNav = document.querySelector('.bottom-nav');
        
        console.log('🔄 updateHeaderVisibility chamado:', show, 'Tela atual:', this.currentScreen);
        
        if (show && this.currentUser && 
            this.currentScreen !== 'login-screen' && 
            this.currentScreen !== 'register-screen') {
            header.classList.add('logged-in');
            bottomNav.classList.add('logged-in');
        } else {
            header.classList.remove('logged-in');
            bottomNav.classList.remove('logged-in');
        }
    }

    checkAuthStatus() {
        if (this.auth && this.auth.isLoggedIn && this.auth.isLoggedIn()) {
            this.currentUser = this.auth.getUser();
            this.showScreen('main-screen');
            this.updateHeaderVisibility(true); 
        } else {
            this.updateHeaderVisibility(false); 
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        if (!this.auth) {
            this.showNotification('Sistema de autenticação não carregado', 'error');
            return;
        }
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        this.showLoading(true);

        const result = await this.auth.login(email, password);

        if (result.success) {
            this.currentUser = result.user;
            this.showScreen('main-screen');
            this.updateHeaderVisibility(true);
            this.showNotification('Login realizado com sucesso!', 'success');
        } else {
            this.showNotification(result.error, 'error');
        }

        this.showLoading(false);
    }

    async handleRegister(e) {
        e.preventDefault();
        
        if (!this.auth) {
            this.showNotification('Sistema de autenticação não carregado', 'error');
            return;
        }
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        this.showLoading(true);

        const result = await this.auth.register(username, email, password);

        if (result.success) {
            this.showNotification('Conta criada com sucesso! Faça login.', 'success');
            this.showScreen('login-screen');
            document.getElementById('register-form').reset();
        } else {
            this.showNotification(result.error, 'error');
        }

        this.showLoading(false);
    }

    async handleAddFood(e) {
    e.preventDefault();
    
    const name = document.getElementById('food-name').value;
    const expiry_date = document.getElementById('food-expiry').value;
    const quantity = document.getElementById('food-quantity').value;
    const food_type = document.getElementById('food-type').value;

    this.showLoading(true);

    try {
        const token = this.auth ? this.auth.getToken() : null;
        
        if (!token) {
            this.showNotification('Você precisa estar logado', 'error');
            return;
        }

        const response = await fetch(`${window.location.origin}/api/foods`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ name, expiry_date, quantity, food_type })
        });

        const data = await response.json();

        if (response.ok) {
            this.showNotification('Alimento cadastrado com sucesso!', 'success');
            this.showScreen('main-screen');
            document.getElementById('add-food-form').reset();
            this.loadFoods();
        } else {
            this.showNotification(data.error || 'Erro ao cadastrar alimento', 'error');
        }
    } catch (error) {
        console.error('❌ Erro ao adicionar alimento:', error);
        this.showNotification('Erro de conexão com o servidor', 'error');
    } finally {
        this.showLoading(false);
    }
}

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (!loading) return;
        
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        alert(message);
    }

    async loadFoods() {
    }

    async loadTips() {
    }

    filterTipsByCategory(button) {
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new EcoMidaApp();
});