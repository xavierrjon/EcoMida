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

    renderFoods(foods) {
        const foodsList = document.getElementById('foods-list');
        const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab') || 'active';
        
        if (!foods || foods.length === 0) {
            this.showEmptyState();
            return;
        }

        let filteredFoods = foods.filter(food => {
            if (activeTab === 'consumed') return food.status === 'consumed';
            if (activeTab === 'discarded') return food.status === 'discarded';
            return food.status === 'active';
        });

        if (filteredFoods.length === 0) {
            this.showTabEmptyState(activeTab);
            return;
        }

        if (activeTab === 'active') {
            filteredFoods.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
        } else {
            filteredFoods.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }

        foodsList.innerHTML = filteredFoods.map(food => {
            const expiryStatus = activeTab === 'active' ? this.getExpiryStatus(food.expiry_date) : '';
            const statusBadge = activeTab !== 'active' ? `
                <span class="status-badge ${food.status}">
                    <span class="material-icons" style="font-size: 16px;">
                        ${food.status === 'consumed' ? 'check_circle' : 'delete_outline'}
                    </span>
                    ${food.status === 'consumed' ? 'Consumido' : 'Descartado'}
                </span>
            ` : '';

            return `
            <div class="food-card">
                <!-- CABEÇALHO -->
                <div class="food-header">
                    <div class="food-title-section">
                        <div class="food-title">${this.escapeHtml(food.name)}</div>
                        <div class="food-category">${this.getCategoryLabel(food.food_type)}</div>
                    </div>
                    ${statusBadge}
                </div>
                
                <!-- INFORMAÇÕES EM GRID -->
                <div class="food-info-grid">
                    <div class="info-item">
                        <span class="info-label">Quantidade</span>
                        <span class="info-value">${this.formatQuantityDisplay(food.quantity, food.unit)}</span>
                    </div>
                    <div class="info-item expiry-status ${expiryStatus}">
                        <span class="info-label">Validade</span>
                        <span class="info-value">
                            ${activeTab === 'active' 
                                ? this.formatExpiryDate(food.expiry_date, food.days_until_expiry)
                                : new Date(food.expiry_date).toLocaleDateString('pt-BR')
                            }
                        </span>
                    </div>
                </div>
                
                <!-- AÇÕES ORGANIZADAS -->
                <div class="food-actions">
                    ${activeTab === 'active' ? `
                        <button class="action-btn btn-consumed consume-food" data-food-id="${food.id}">
                            <span class="material-icons" style="font-size: 18px;">check</span>
                            <span>Consumido</span>
                        </button>
                        <button class="action-btn btn-discarded discard-food" data-food-id="${food.id}">
                            <span class="material-icons" style="font-size: 18px;">close</span>
                            <span>Descartado</span>
                        </button>
                    ` : `
                        <button class="action-btn btn-reactivate reactivate-food" data-food-id="${food.id}">
                            <span class="material-icons" style="font-size: 18px;">refresh</span>
                            <span>Reativar</span>
                        </button>
                        <div style="grid-column: 2 / span 2;"></div>
                    `}
                    
                    <button class="icon-btn edit-food" data-food-id="${food.id}" title="Editar">
                        <span class="material-icons" style="font-size: 18px;">edit</span>
                    </button>
                    <button class="icon-btn btn-delete delete-food" data-food-id="${food.id}" title="Excluir">
                        <span class="material-icons" style="font-size: 18px;">delete</span>
                    </button>
                </div>
            </div>
            `;
        }).join('');

        this.attachFoodEvents();
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

            if (e.target.classList.contains('tab-btn')) {
                const tabBtn = e.target.closest('.tab-btn');
                this.switchFoodTab(tabBtn);
                return;
            }

            if (e.target.closest('.nav-btn')) {
                const btn = e.target.closest('.nav-btn');
                const screen = btn.getAttribute('data-screen');
                this.showScreen(screen);
                this.updateActiveNav(btn);
            }

            if (e.target.id === 'fab-add-food' || e.target.closest('#fab-add-food')) {
                this.showScreen('add-food-screen');
                return;
            }

            if (e.target.id === 'cancel-add-food') {
                this.showScreen('main-screen');
            }

            if (e.target.classList.contains('category-btn')) {
                this.filterTipsByCategory(e.target);
            }

            if (e.target.id === 'notification-settings-btn' || e.target.closest('#notification-settings-btn')) {
                console.log('🔔 Botão de notificações clicado');
                
                if (!this.currentUser) {
                    this.showNotification('Faça login para acessar as configurações', 'error');
                    return;
                }
                
                if (window.notificationSettings) {
                    window.notificationSettings.showSettings();
                } else {
                    console.error('❌ NotificationSettings não carregado');
                    this.showNotification('Sistema de configurações não carregado', 'error');
                }
                return;
            }

            if (e.target.id === 'notification-settings-btn' || e.target.closest('#notification-settings-btn')) {
                e.preventDefault();
                console.log('📱 Botão de notificações tocado no mobile');
                
                if (!this.currentUser) {
                    this.showNotification('Faça login para acessar as configurações', 'error');
                    return;
                }
                
                if (window.notificationSettings) {
                    window.notificationSettings.showSettings();
                }
                return;
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

    switchFoodTab(activeTabBtn) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        activeTabBtn.classList.add('active');

        if (window.foodsManager) {
            window.foodsManager.loadFoods();
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
        const fab = document.getElementById('fab-add-food');
        
        if (screenId === 'main-screen' && this.currentUser) {
            if (fab) fab.style.display = 'flex';
        } else {
            if (fab) fab.style.display = 'none';
        }

        switch(screenId) {
            case 'main-screen':
                if (window.foodsManager) {
                    window.foodsManager.loadFoods();
                }
                break;
            case 'tips-screen':
                if (window.tipsManager) {
                    window.tipsManager.loadTips();
                }
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
        const unit = document.getElementById('food-unit').value;
        const food_type = document.getElementById('food-type').value;

        if (!name || !expiry_date) {
            this.showNotification('Nome e data de validade são obrigatórios', 'error');
            return;
        }

        if (!quantity || parseFloat(quantity) <= 0) {
            this.showNotification('Quantidade deve ser maior que zero', 'error');
            return;
        }

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
                body: JSON.stringify({ 
                    name, 
                    expiry_date, 
                    quantity: parseFloat(quantity),
                    unit,
                    food_type 
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Alimento cadastrado com sucesso!', 'success');
                this.showScreen('main-screen');
                document.getElementById('add-food-form').reset();
                
                document.getElementById('food-quantity').value = '1';
                document.getElementById('food-unit').value = 'unidades';
                
                if (window.foodsManager) {
                    window.foodsManager.loadFoods();
                }
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