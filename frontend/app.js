class EcoMidaApp {
    constructor() {
        this.currentScreen = 'login-screen';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.showScreen('login-screen');
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-btn')) {
                const btn = e.target.closest('.nav-btn');
                const screen = btn.getAttribute('data-screen');
                this.showScreen(screen);
                this.updateActiveNav(btn);
            }

            if (e.target.id === 'show-register') {
                this.showScreen('register-screen');
            }

            if (e.target.id === 'cancel-register') {
                this.showScreen('login-screen');
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

        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('add-food-form')?.addEventListener('submit', (e) => this.handleAddFood(e));
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

        this.onScreenShow(screenId);
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
        
        if (show && this.currentUser) {
            header.style.display = 'flex';
            bottomNav.style.display = 'flex';
        } else {
            header.style.display = 'none';
            bottomNav.style.display = 'none';
        }
    }

    checkAuthStatus() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
            this.currentUser = JSON.parse(userData);
            this.showScreen('main-screen');
            this.updateHeaderVisibility(true);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        this.showLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                
                this.currentUser = data.user;
                this.showScreen('main-screen');
                this.updateHeaderVisibility(true);
                
                this.showNotification('Login realizado com sucesso!', 'success');
            } else {
                this.showNotification(data.error || 'Erro no login', 'error');
            }
        } catch (error) {
            this.showNotification('Erro de conexão com o servidor', 'error');
            console.error('Login error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        this.showLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Conta criada com sucesso! Faça login.', 'success');
                this.showScreen('login-screen');
                document.getElementById('register-form').reset();
            } else {
                this.showNotification(data.error || 'Erro no registro', 'error');
            }
        } catch (error) {
            this.showNotification('Erro de conexão com o servidor', 'error');
            console.error('Register error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleAddFood(e) {
        e.preventDefault();
        
        const name = document.getElementById('food-name').value;
        const expiry_date = document.getElementById('food-expiry').value;
        const quantity = document.getElementById('food-quantity').value;
        const food_type = document.getElementById('food-type').value;

        this.showLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:5000/api/foods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
            this.showNotification('Erro de conexão com o servidor', 'error');
            console.error('Add food error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async loadFoods() {
        const foodsList = document.getElementById('foods-list');
        if (!foodsList) return;

        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/foods', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderFoodsList(data.foods);
            } else {
                foodsList.innerHTML = this.getEmptyState('Erro ao carregar alimentos');
            }
        } catch (error) {
            foodsList.innerHTML = this.getEmptyState('Erro de conexão');
            console.error('Load foods error:', error);
        }
    }

    renderFoodsList(foods) {
        const foodsList = document.getElementById('foods-list');
        
        if (!foods || foods.length === 0) {
            foodsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">kitchen</span>
                    <p>Nenhum alimento cadastrado</p>
                    <button id="add-first-food" class="btn-primary">Cadastrar primeiro alimento</button>
                </div>
            `;
            return;
        }

        foodsList.innerHTML = foods.map(food => `
            <div class="food-card ${this.getFoodStatusClass(food)}">
                <div class="food-info">
                    <h3>${food.name}</h3>
                    <div class="food-expiry ${this.getExpiryClass(food.days_until_expiry)}">
                        ${this.getExpiryText(food.expiry_date, food.days_until_expiry)}
                    </div>
                    <div class="food-meta">
                        <small>Quantidade: ${food.quantity} • ${this.getFoodTypeLabel(food.food_type)}</small>
                    </div>
                </div>
                <div class="food-actions">
                    <button class="action-btn" onclick="app.consumeFood('${food.id}')" title="Marcar como consumido">
                        <span class="material-icons">check_circle</span>
                    </button>
                    <button class="action-btn" onclick="app.deleteFood('${food.id}')" title="Excluir">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFoodStatusClass(food) {
        if (food.is_expired) return 'status-expired';
        if (food.days_until_expiry <= 3) return 'status-expiring';
        return 'status-ok';
    }

    getExpiryClass(daysUntil) {
        if (daysUntil < 0) return 'expired';
        if (daysUntil <= 3) return 'expiring';
        return '';
    }

    getExpiryText(expiryDate, daysUntil) {
        if (daysUntil < 0) {
            return `Venceu ${Math.abs(daysUntil)} dias atrás`;
        } else if (daysUntil === 0) {
            return 'Vence hoje';
        } else if (daysUntil === 1) {
            return 'Vence amanhã';
        } else if (daysUntil <= 3) {
            return `Vence em ${daysUntil} dias`;
        } else {
            const date = new Date(expiryDate);
            return `Vence em ${date.toLocaleDateString('pt-BR')}`;
        }
    }

    getFoodTypeLabel(type) {
        const types = {
            'laticinios': 'Laticínios',
            'frutas': 'Frutas',
            'verduras': 'Verduras',
            'carnes': 'Carnes',
            'graos': 'Grãos',
            'bebidas': 'Bebidas',
            'outros': 'Outros'
        };
        return types[type] || type;
    }

    async loadTips() {
        const tipsList = document.getElementById('tips-list');
        tipsList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">tips_and_updates</span>
                <p>Sistema de dicas em desenvolvimento</p>
            </div>
        `;
    }

    filterTipsByCategory(button) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        console.log('Filtrar dicas por:', button.getAttribute('data-category'));
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message);
    }

    async consumeFood(foodId) {
        console.log('Marcar como consumido:', foodId);
        this.showNotification('Funcionalidade em desenvolvimento');
    }

    async deleteFood(foodId) {
        console.log('Excluir alimento:', foodId);
        this.showNotification('Funcionalidade em desenvolvimento');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new EcoMidaApp();
});