class NotificationSettings {
    constructor() {
        this.baseURL = `${window.location.origin}/api`;
        this.settings = null;
    }

    async init() {
        await this.loadSettings();
        this.renderSettingsUI();
    }

    async loadSettings() {
        try {
            const token = window.authManager?.getToken();
            if (!token) {
                return;
            }

            const response = await fetch(`${this.baseURL}/notifications/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.settings = data.settings;
            } else {
                this.settings = this.getDefaultSettings();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            "enabled": true,
            "days_before": 3,
            "push_notifications": true,
            "email_notifications": false,
            "alert_sound": true,
            "quiet_hours": {
                "enabled": false,
                "start": "22:00",
                "end": "08:00"
            }
        };
    }

    async saveSettings(newSettings) {
        try {
            const token = window.authManager?.getToken();
            if (!token) {
                alert('🔐 Você precisa estar logado para salvar configurações');
                return false;
            }

            const response = await fetch(`${this.baseURL}/notifications/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    notification_settings: newSettings
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.settings = data.settings;
                
                this.showSaveFeedback(true);
                return true;
            } else {
                const errorData = await response.json();
                console.error('❌ Erro do servidor:', errorData);
                throw new Error(errorData.error || 'Erro ao salvar configurações');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error);
            this.showSaveFeedback(false, error.message);
            return false;
        }
    }

    renderSettingsUI() {
        this.createSettingsScreen();
    }

    createSettingsScreen() {
        let settingsScreen = document.getElementById('notification-settings-screen');
        
        if (!settingsScreen) {
            settingsScreen = document.createElement('section');
            settingsScreen.id = 'notification-settings-screen';
            settingsScreen.className = 'screen';
            settingsScreen.innerHTML = this.getSettingsHTML();
            
            const mainContent = document.querySelector('.main-content');
            mainContent.appendChild(settingsScreen);
            
            this.attachSettingsEvents();
        }
        
        this.updateSettingsForm();
    }

    getSettingsHTML() {
        return `
        <div class="screen-header">
            <button class="back-btn" id="back-from-settings">
                <span class="material-icons">arrow_back</span>
            </button>
            <h2>Configurações de Alertas</h2>
        </div>

        <div class="settings-container">
            <form id="notification-settings-form">
                <!-- TOGGLE PRINCIPAL -->
                <div class="setting-group">
                    <div class="setting-item toggle-setting">
                        <div class="setting-info">
                            <span class="material-icons">notifications</span>
                            <div>
                                <h3>Alertas Ativos</h3>
                                <p>Receber alertas sobre alimentos próximos do vencimento</p>
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifications-enabled" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <!-- DIAS DE ANTECEDÊNCIA -->
                <div class="setting-group">
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="material-icons">event</span>
                            <div>
                                <h3>Dias de Antecedência</h3>
                                <p>Quantos dias antes do vencimento receber os alertas</p>
                            </div>
                        </div>
                        <select id="days-before" class="setting-select">
                            <option value="1">1 dia antes</option>
                            <option value="2">2 dias antes</option>
                            <option value="3" selected>3 dias antes</option>
                            <option value="5">5 dias antes</option>
                            <option value="7">1 semana antes</option>
                        </select>
                    </div>
                </div>

                <!-- TIPOS DE NOTIFICAÇÃO -->
                <div class="setting-group">
                    <h3 class="setting-subtitle">Tipos de Notificação</h3>
                    
                    <div class="setting-item toggle-setting">
                        <div class="setting-info">
                            <span class="material-icons">notifications_active</span>
                            <div>
                                <h3>Notificações Push</h3>
                                <p>Alertas no navegador e dispositivo</p>
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="push-notifications" checked>
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="setting-item toggle-setting">
                        <div class="setting-info">
                            <span class="material-icons">email</span>
                            <div>
                                <h3>Notificações por Email</h3>
                                <p>Alertas enviados para seu email</p>
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="email-notifications">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="setting-item toggle-setting">
                        <div class="setting-info">
                            <span class="material-icons">volume_up</span>
                            <div>
                                <h3>Som de Alerta</h3>
                                <p>Reproduzir som quando houver notificações</p>
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="alert-sound" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <!-- HORÁRIO SILENCIOSO -->
                <div class="setting-group">
                    <div class="setting-item toggle-setting">
                        <div class="setting-info">
                            <span class="material-icons">nights_stay</span>
                            <div>
                                <h3>Horário Silencioso</h3>
                                <p>Não receber notificações durante a noite</p>
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="quiet-hours-enabled">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="quiet-hours-settings" id="quiet-hours-settings" style="display: none;">
                        <div class="time-inputs">
                            <div class="time-input">
                                <label>Início</label>
                                <input type="time" id="quiet-hours-start" value="22:00">
                            </div>
                            <div class="time-input">
                                <label>Término</label>
                                <input type="time" id="quiet-hours-end" value="08:00">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AÇÕES -->
                <div class="setting-actions">
                    <button type="button" id="test-notification" class="btn-secondary">
                        <span class="material-icons">notifications</span>
                        Testar Notificação
                    </button>
                    <button type="submit" class="btn-primary">
                        <span class="material-icons">save</span>
                        Salvar Configurações
                    </button>
                </div>
            </form>

            <div id="save-feedback" class="save-feedback hidden">
                <span class="material-icons">check_circle</span>
                <span>Configurações salvas com sucesso!</span>
            </div>
        </div>
        `;
    }

    updateSettingsForm() {
        if (!this.settings) return;

        document.getElementById('notifications-enabled').checked = this.settings.enabled;
        
        document.getElementById('days-before').value = this.settings.days_before;
        
        document.getElementById('push-notifications').checked = this.settings.push_notifications;
        document.getElementById('email-notifications').checked = this.settings.email_notifications;
        document.getElementById('alert-sound').checked = this.settings.alert_sound;
        
        document.getElementById('quiet-hours-enabled').checked = this.settings.quiet_hours.enabled;
        document.getElementById('quiet-hours-start').value = this.settings.quiet_hours.start;
        document.getElementById('quiet-hours-end').value = this.settings.quiet_hours.end;
        
        this.toggleQuietHoursSettings(this.settings.quiet_hours.enabled);
    }

    attachSettingsEvents() {
        document.getElementById('back-from-settings').addEventListener('click', () => {
            this.hideSettings();
        });

        document.getElementById('quiet-hours-enabled').addEventListener('change', (e) => {
            this.toggleQuietHoursSettings(e.target.checked);
        });

        document.getElementById('test-notification').addEventListener('click', () => {
            this.testNotification();
        });

        document.getElementById('notification-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveSettings();
        });
    }

    toggleQuietHoursSettings(show) {
        const quietHoursSettings = document.getElementById('quiet-hours-settings');
        if (quietHoursSettings) {
            quietHoursSettings.style.display = show ? 'block' : 'none';
        }
    }

    async handleSaveSettings() {
        const newSettings = {
            enabled: document.getElementById('notifications-enabled').checked,
            days_before: parseInt(document.getElementById('days-before').value),
            push_notifications: document.getElementById('push-notifications').checked,
            email_notifications: document.getElementById('email-notifications').checked,
            alert_sound: document.getElementById('alert-sound').checked,
            quiet_hours: {
                enabled: document.getElementById('quiet-hours-enabled').checked,
                start: document.getElementById('quiet-hours-start').value,
                end: document.getElementById('quiet-hours-end').value
            }
        };

        const success = await this.saveSettings(newSettings);
        
        if (success) {
            if (window.notificationsSimple) {
                window.notificationsSimple.showAlertsInUI();
            }
        }
    }

    async testNotification() {
        let notificationsSystem = window.notificationsSimple;
        
        if (!notificationsSystem) {
            notificationsSystem = window.notificationsSimple || 
                                window.notifications || 
                                window.app?.notifications;
        }
        
        if (notificationsSystem && typeof notificationsSystem.testNotification === 'function') {
            await notificationsSystem.testNotification();
        } else {
            console.error('❌ Sistema de notificações não disponível:', {
                notificationsSimple: !!window.notificationsSimple,
                notifications: !!window.notifications,
                app: !!window.app
            });
            
            this.showNativeNotification();
        }
    }

    showNativeNotification() {
        if (!('Notification' in window)) {
            alert('❌ Este navegador não suporta notificações de desktop');
            return;
        }

        if (Notification.permission === 'granted') {
          
            const notification = new Notification('🔔 EcoMida - Teste', {
                body: 'Notificações estão funcionando! Você receberá alertas quando alimentos estiverem próximos do vencimento.',
                icon: '/images/ecomida192.png',
                badge: '/images/ecomida192.png',
                requireInteraction: true
            });

            notification.onclick = function() {
                window.focus();
                notification.close();
            };

        } else if (Notification.permission === 'default') {
          
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showNativeNotification(); 
                } else {
                    alert('🔕 Permissão para notificações negada');
                }
            });
        } else {
            alert('🔕 Permissão para notificações foi negada anteriormente. Verifique as configurações do seu navegador.');
        }
    }

    showSaveFeedback(success, message = '') {
        const feedback = document.getElementById('save-feedback');
        if (!feedback) return;

        if (success) {
            feedback.innerHTML = `
                <span class="material-icons" style="color: #4CAF50;">check_circle</span>
                <span>Configurações salvas com sucesso!</span>
            `;
            feedback.className = 'save-feedback success';
        } else {
            feedback.innerHTML = `
                <span class="material-icons" style="color: #f44336;">error</span>
                <span>${message || 'Erro ao salvar configurações'}</span>
            `;
            feedback.className = 'save-feedback error';
        }

        feedback.classList.remove('hidden');

        setTimeout(() => {
            feedback.classList.add('hidden');
        }, 5000);
    }

    showSettings() {
        this.updateSettingsForm();
        document.getElementById('notification-settings-screen').classList.add('active');
    }

    hideSettings() {
        document.getElementById('notification-settings-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
    }
}

function initializeNotificationSettings() {
    // Criar instância
    window.notificationSettings = new NotificationSettings();
    
    // Função para inicializar quando apropriado
    const initializeWhenReady = async () => {
        // Esperar por authManager
        if (!window.authManager) {
            setTimeout(initializeWhenReady, 100);
            return;
        }
        
        // Só inicializar se estiver logado
        if (window.authManager.isLoggedIn && window.authManager.isLoggedIn()) {
            try {
                await window.notificationSettings.init();
            } catch (error) {
                console.error('❌ Erro ao inicializar settings:', error);
            }
        }
    };
    
    // Iniciar a verificação
    setTimeout(initializeWhenReady, 1000); // Delay maior para garantir
}

// Inicializar de forma controlada
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeNotificationSettings, 800); // Atraso estratégico
});

// Escutar evento app-ready
window.addEventListener('app-ready', () => {
    if (window.notificationSettings && !window.notificationSettings.isInitialized) {
        setTimeout(async () => {
            if (window.authManager && window.authManager.isLoggedIn && 
                window.authManager.isLoggedIn() && window.notificationSettings.init) {
                try {
                    await window.notificationSettings.init();
                } catch (error) {
                    console.error('❌ Erro na inicialização tardia:', error);
                }
            }
        }, 1500);
    }
});