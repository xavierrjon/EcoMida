class EcoMidaApp {
    constructor() {
        this.currentScreen = 'login-screen';
        this.currentUser = null;
        this.baseURL = `${window.location.origin}/api`;
        this.auth = null;
        this.notificationModuleLoaded = false;
        this.initialized = false;

        this.init();
    }

    async loadNotificationModule() {

        if (this.notificationModuleLoaded) {
            return true;
        }

        try {
            this.showNotification('Carregando sistema de notificações...', 'info');

            if (!window.notificationSettings || typeof window.notificationSettings.showSettings !== 'function') {

                await this.loadScript('notification-settings.js');
                await this.loadScript('notifications-simple.js');

                if (window.notificationSettings && typeof window.notificationSettings.init === 'function') {
                    await window.notificationSettings.init();
                }

                if (window.notificationsSimple && typeof window.notificationsSimple.setup === 'function') {
                    await window.notificationsSimple.setup();
                }
            }

            this.notificationModuleLoaded = true;
            return true;

        } catch (error) {
            this.showNotification('Erro ao carregar notificações', 'error');
            return false;
        }
    }

    async retryNotificationInitialization() {

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const loaded = await this.loadNotificationModule();

            if (loaded) {
        
                if (window.notificationsSimple && window.notificationsSimple.showAlertsInUI) {
                    setTimeout(() => {
                        window.notificationsSimple.showAlertsInUI();
                    }, 1000);
                }

                return true;
            }
        } catch (error) {
            console.error('❌ Erro na retentativa:', error);
        }

        return false;
    }

    async loadScript(src) {
        return new Promise((resolve, reject) => {
           
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            script.onload = () => {
                resolve();
            };

            script.onerror = (error) => {
                console.error(`❌ Erro ao carregar script ${src}:`, error);
                reject(error);
            };

            document.body.appendChild(script);
        });
    }

    init() {

        this.auth = window.authManager;

        setTimeout(() => {
            this.setupEventListeners();
            this.checkAuthStatus();
            this.initialized = true;

            this.dispatchAppReadyEvent();
        }, 100); 
    }

    dispatchAppReadyEvent() {
        const event = new CustomEvent('app-ready', {
            detail: {
                user: this.currentUser,
                app: this
            }
        });
        window.dispatchEvent(event);
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
        document.addEventListener('click', async (e) => {
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
                return;
            }

            if (e.target.classList.contains('category-btn')) {
                this.filterTipsByCategory(e.target);
                return;
            }

            if (e.target.id === 'notification-settings-btn' || e.target.closest('#notification-settings-btn')) {

                if (!this.currentUser) {
                    this.showNotification('Faça login para acessar as configurações', 'error');
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                const btn = e.target.closest('#notification-settings-btn');
                if (btn) {
                    btn.classList.add('loading');
                    btn.disabled = true;
                }

                try {
                    const loaded = await this.loadNotificationModule();

                    if (loaded && window.notificationSettings && typeof window.notificationSettings.showSettings === 'function') {
                      
                        setTimeout(() => {
                            window.notificationSettings.showSettings();
                        }, 100);
                    } else {
                        this.showNotification('Configurações de notificação não disponíveis', 'warning');
                    }
                } catch (error) {
                    console.error('❌ Erro ao abrir notificações:', error);
                    this.showNotification('Erro ao carregar configurações', 'error');
                } finally {
                    if (btn) {
                        btn.classList.remove('loading');
                        btn.disabled = false;
                    }
                }
                return;
            }

            if (e.target.id === 'profile-btn' || e.target.closest('#profile-btn')) {

                if (!this.currentUser) {
                    this.showNotification('Faça login para acessar o perfil', 'error');
                    return;
                }

                if (window.profileManager) {
                    window.profileManager.showProfile();
                } else {
                    console.error('❌ ProfileManager não carregado');
                    this.showNotification('Sistema de perfil não carregado', 'error');
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
    }

    onScreenShow(screenId) {
        const fab = document.getElementById('fab-add-food');

        if (screenId === 'main-screen' && this.currentUser) {
            if (fab) fab.style.display = 'flex';

            if (!this.notificationModuleLoaded) {
                setTimeout(async () => {
                    try {
                        await this.loadNotificationModule();

                        if (window.notificationsSimple && typeof window.notificationsSimple.showAlertsInUI === 'function') {
                            setTimeout(() => {
                                window.notificationsSimple.showAlertsInUI();
                            }, 2000);
                        }
                    } catch (error) {
                        console.log('⚠️ Notificações carregadas em background com erro:', error);
                    }
                }, 1000);
            }
        } else {
            if (fab) fab.style.display = 'none';
        }

        switch (screenId) {
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

            setTimeout(() => {
                if (window.foodsManager && window.foodsManager.loadFoods) {
                    window.foodsManager.loadFoods();
                }

                setTimeout(async () => {
                    try {
                        await this.loadNotificationModule();

                        setTimeout(() => {
                            if (!window.notificationsSimple ||
                                !window.notificationsSimple.isInitialized) {
                                this.retryNotificationInitialization();
                            }
                        }, 3000);

                    } catch (error) {
                        console.error('❌ Erro inicial no carregamento de notificações:', error);

                        setTimeout(() => this.retryNotificationInitialization(), 4000);
                    }
                }, 1000);

            }, 300);

        } else {
            this.currentUser = null;
            this.showScreen('login-screen');
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

            setTimeout(async () => {
                await this.loadNotificationModule();
            }, 1000);

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
        const notification = document.createElement('div');
        notification.className = `global-notification ${type}`;
        notification.innerHTML = `
            <span class="material-icons">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    getExpiryStatus(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'expired';
        if (diffDays <= 3) return 'expiring';
        return 'ok';
    }

    formatExpiryDate(dateString, daysUntilExpiry = null) {
        try {
            const date = new Date(dateString);
            const formatted = date.toLocaleDateString('pt-BR');

            if (daysUntilExpiry !== null) {
                if (daysUntilExpiry < 0) {
                    return `${formatted} (Vencido há ${Math.abs(daysUntilExpiry)} dias)`;
                } else if (daysUntilExpiry === 0) {
                    return `${formatted} (Vence hoje!)`;
                } else if (daysUntilExpiry === 1) {
                    return `${formatted} (Vence amanhã!)`;
                } else if (daysUntilExpiry <= 7) {
                    return `${formatted} (Vence em ${daysUntilExpiry} dias)`;
                } else {
                    return `${formatted} (Vence em ${daysUntilExpiry} dias)`;
                }
            }

            return formatted;
        } catch (error) {
            return dateString;
        }
    }

    formatQuantityDisplay(quantity, unit) {
        const unitsMap = {
            'unidades': 'unid',
            'kg': 'kg',
            'g': 'g',
            'litros': 'L',
            'ml': 'ml',
            'pacotes': 'pct',
            'caixas': 'cx',
            'potes': 'pt',
            'outro': 'unid'
        };

        const shortUnit = unitsMap[unit] || unit;
        const formattedQuantity = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);

        return `${formattedQuantity} ${shortUnit}`;
    }

    getCategoryLabel(category) {
        const categories = {
            'laticinios': 'Laticínios',
            'frutas': 'Frutas',
            'verduras': 'Verduras',
            'carnes': 'Carnes',
            'graos': 'Grãos',
            'bebidas': 'Bebidas',
            'outros': 'Outros'
        };
        return categories[category] || category;
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showEmptyState() {
        const foodsList = document.getElementById('foods-list');
        if (foodsList) {
            foodsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">kitchen</span>
                    <p>Nenhum alimento cadastrado</p>
                    <p class="empty-state-hint">Clique no botão + para adicionar</p>
                </div>
            `;
        }
    }

    showTabEmptyState(tab) {
        const foodsList = document.getElementById('foods-list');
        const messages = {
            'active': 'Nenhum alimento ativo',
            'consumed': 'Nenhum alimento consumido',
            'discarded': 'Nenhum alimento descartado'
        };

        foodsList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">${tab === 'active' ? 'kitchen' : 'inventory_2'}</span>
                <p>${messages[tab] || 'Nenhum alimento'}</p>
            </div>
        `;
    }

    async loadFoods() {
        
    }

    async loadTips() {
        
    }

    filterTipsByCategory(button) {
        
    }

    attachFoodEvents() {
      
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new EcoMidaApp();
});

if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .global-notification {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
        }
        
        #notification-settings-btn.loading {
            opacity: 0.7;
            pointer-events: none;
        }
        
        #notification-settings-btn.loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            transform: translate(-50%, -50%);
        }
        
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}