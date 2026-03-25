class NotificationsSimple {
    constructor() {
        this.baseURL = `${window.location.origin}/api`;
        this.isSupported = this.checkSupport();
        this.isSubscribed = false;
        this.hasPermission = false;
        this.lastNotificationTime = 0;
        this.isInitialized = false;
    }

    checkSupport() {
        const hasNotification = 'Notification' in window;
        const isHTTPS = window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname.includes('ngrok');

        return hasNotification && isHTTPS;
    }

    getAppContext() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        const isStandalone = 'standalone' in window.navigator && window.navigator.standalone;

        return {
            isMobile: isMobile,
            isPWA: isPWA || isStandalone,
            context: isPWA ? 'pwa' : (isMobile ? 'mobile_browser' : 'desktop')
        };
    }

    async setup() {
        if (this.isInitialized) {
            return true;
        }

        if (!this.isSupported) {
            return false;
        }

        try {
            this.hasPermission = this.getPermissionStatus();

            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('/sw-notifications.js', { scope: '/' });
            }

            this.isInitialized = true;

            return true;
        } catch (error) {
            console.error('❌ Erro no setup:', error);
            return false;
        }
    }

    getPermissionStatus() {
        if (!('Notification' in window)) return 'not-supported';

        switch (Notification.permission) {
            case 'granted':
                return 'granted';
            case 'denied':
                return 'denied';
            case 'default':
                return 'default';
            default:
                return 'unknown';
        }
    }

    async testNotification() {
        const context = this.getAppContext();

        if (context.isMobile && !context.isPWA) {
            return await this.showPWAInstallPrompt();
        }

        if (!this.isSupported) {
            this.showNotSupportedMessage();
            return false;
        }

        const permissionStatus = this.getPermissionStatus();

        switch (permissionStatus) {
            case 'granted':
                return await this.showTestNotification();

            case 'denied':
                this.showPermissionHelp(true);
                return false;

            case 'default':
                return await this.requestPermission();

            default:
                this.showNotSupportedMessage();
                return false;
        }
    }

    async showPWAInstallPrompt() {
        return new Promise((resolve) => {
            const message = `
🎯 **Melhor Experiência no Mobile**

No navegador, as notificações podem não funcionar perfeitamente devido a limitações de segurança.

**💡 Recomendação: Instale o EcoMida como App**

Para instalar:
📱 **Android Chrome:**
   • Toque no menu (⋯) 
   • "Adicionar à tela inicial"

📱 **iPhone Safari:**
   • Toque no ícone de compartilhar (⎗)
   • "Adicionar à tela inicial"

**✅ Como app nativo, você terá:**
• Notificações confiáveis sobre alimentos
• Acesso rápido direto da tela inicial  
• Experiência otimizada para mobile
• Funcionamento offline parcial

Deseja tentar as notificações no navegador mesmo assim?
            `;

            const tryAnyway = confirm(message);
            if (tryAnyway) {

                this.continueWithNormalFlow().then(resolve);
            } else {
                resolve(false);
            }
        });
    }

    async continueWithNormalFlow() {
        if (!this.isSupported) {
            this.showNotSupportedMessage();
            return false;
        }

        const permissionStatus = this.getPermissionStatus();

        switch (permissionStatus) {
            case 'granted':
                return await this.showTestNotification();
            case 'denied':
                this.showPermissionHelp(true);
                return false;
            case 'default':
                return await this.requestPermission();
            default:
                return false;
        }
    }

    async requestPermission() {
        try {

            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                this.hasPermission = true;
                await this.showTestNotification();
                return true;
            } else {
                this.showPermissionHelp(false);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao pedir permissão:', error);
            this.showPermissionHelp(false);
            return false;
        }
    }

    async showTestNotification() {
        try {
            const context = this.getAppContext();
            const options = {
                body: '✅ Notificações estão funcionando! Você receberá alertas quando alimentos estiverem próximos do vencimento.',
                icon: '/images/ecomida192.png',
                badge: '/images/ecomida192.png',
                tag: 'test-notification'
            };

            if (context.isMobile) {
                options.requireInteraction = false;
            }

            const notification = new Notification('🍎 EcoMida - Teste', options);

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            setTimeout(() => {
                notification.close();
            }, context.isMobile ? 4000 : 6000);

            return true;

        } catch (error) {
            console.error('❌ Erro ao mostrar notificação:', error);

            alert('🔔 EcoMida\n\nNotificações configuradas! Você receberá alertas quando alimentos estiverem próximos do vencimento.');
            return true;
        }
    }

    async showAlertsInUI() {
        const expiringFoods = await this.checkExpiringFoods();

        if (expiringFoods.length > 0) {
            this.createAlertBadge(expiringFoods.length);


            await this.showAutomaticNotification(expiringFoods);
        } else {
            this.removeAlertBadge();
        }
    }

    async showAutomaticNotification(expiringFoods) {
        const context = this.getAppContext();

        if (this.getPermissionStatus() !== 'granted') {
            return;
        }

        const now = Date.now();
        if (now - this.lastNotificationTime < 60000) {
            return;
        }

        try {
            const foodsByDays = {};

            expiringFoods.forEach(food => {
                // Usar days_until_expiry do backend (já corrigido)
                const daysUntil = food.days_until_expiry;

                if (!foodsByDays[daysUntil]) {
                    foodsByDays[daysUntil] = [];
                }

                foodsByDays[daysUntil].push({
                    name: food.name,
                    message: food.expiry_message,
                    days: daysUntil,
                    expiry_date: food.expiry_date,
                    full_object: food
                });
            });

            let message = '';
            let title = '🍎 EcoMida';
            let requireInteraction = true;

            if (foodsByDays[0] && foodsByDays[0].length > 0) {
                title = '⚠️ Atenção!';
                if (foodsByDays[0].length === 1) {

                    message = `${foodsByDays[0][0].name} vence HOJE! Consuma ou descarte agora.`;
                } else {

                    const foodNames = foodsByDays[0].slice(0, 3).map(f => f.name);
                    const foodList = foodNames.join(', ');
                    const extra = foodsByDays[0].length > 3 ? ` e mais ${foodsByDays[0].length - 3} alimentos` : '';
                    message = `${foodList}${extra} vencem HOJE! Ação necessária.`;
                }
            }

            else if (foodsByDays[1] && foodsByDays[1].length > 0) {
                title = '🔔 Alerta!';
                if (foodsByDays[1].length === 1) {

                    message = `${foodsByDays[1][0].name} vence AMANHÃ! Planeje seu consumo.`;
                } else {

                    const foodNames = foodsByDays[1].slice(0, 3).map(f => f.name);
                    const foodList = foodNames.join(', ');
                    message = `${foodList} vencem amanhã! Verifique sua despensa.`;
                }
            }

            else if (foodsByDays[2] && foodsByDays[2].length > 0) {
                title = '📅 Lembrete';
                if (foodsByDays[2].length === 1) {

                    message = `${foodsByDays[2][0].name} vence em 2 dias.`;
                } else {

                    message = `${foodsByDays[2].length} alimentos vencem em 2 dias.`;
                }
                requireInteraction = false;
            }

            else {
                for (const [days, foods] of Object.entries(foodsByDays)) {
                    const daysInt = parseInt(days);
                    if (daysInt >= 3 && daysInt <= 7) {
                        title = '🍽️ Aviso';
                        if (foods.length === 1) {

                            message = `${foods[0].name} vence em ${days} dias.`;
                        } else {
                            message = `${foods.length} alimentos vencem em ${days} dias.`;
                        }
                        requireInteraction = false;
                        break;
                    }
                }
            }

            if (message) {
                const options = {
                    body: message,
                    icon: '/images/ecomida192.png',
                    badge: '/images/ecomida192.png',
                    tag: 'food-expiry-alert',
                    requireInteraction: requireInteraction
                };

                if (context.isMobile) {
                    options.requireInteraction = false;
                }

                const notification = new Notification(title, options);

                notification.onclick = () => {
                    window.focus();

                    if (window.app) {
                        window.app.showScreen('main-screen');
                    }

                    notification.close();
                };

                const autoCloseTime = requireInteraction ? 10000 : 6000;
                setTimeout(() => {
                    notification.close();
                }, autoCloseTime);

                this.lastNotificationTime = now;
            }

        } catch (error) {
            console.error('❌ Erro na notificação automática:', error);
        }
    }

    async checkExpiringFoods() {
        try {
            const token = window.authManager?.getToken();
            if (!token) {
                return [];
            }

            const response = await fetch(`${this.baseURL}/notifications/expiring`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.notifications;
            }

            return [];
        } catch (error) {
            console.error('❌ Erro ao verificar alimentos:', error);
            return [];
        }
    }

    createAlertBadge(count) {

        this.removeAlertBadge();

        const alertBtn = document.getElementById('notification-settings-btn');
        if (alertBtn && count > 0) {
            const badge = document.createElement('div');
            badge.className = 'alert-badge';
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100;
            `;

            alertBtn.style.position = 'relative';
            alertBtn.appendChild(badge);
        }
    }

    removeAlertBadge() {
        const existingBadge = document.querySelector('.alert-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
    }

    showPermissionHelp(isDenied) {
        const context = this.getAppContext();

        let message = '🔔 Configuração de Notificações\n\n';

        if (isDenied) {
            message += 'Você negou a permissão para notificações.\n\n';
        } else {
            message += 'Para receber alertas sobre alimentos:\n\n';
        }

        if (context.isMobile && context.isPWA) {
            message += '📱 **App EcoMida (PWA):**\n';
            message += '• Notificações devem funcionar automaticamente\n';
            message += '• Verifique configurações do dispositivo se necessário';
        } else if (context.isMobile) {
            message += '📱 **Navegador Mobile:**\n';
            message += '• Instale como app para melhor experiência\n';
            message += '• Ou verifique configurações de notificação do site';
        } else {
            message += '💻 **Desktop:**\n';
            message += '• Verifique o ícone de notificação na barra de endereços\n';
            message += '• Permita notificações para este site';
        }

        alert(message);
    }

    showNotSupportedMessage() {
        const context = this.getAppContext();

        let message = '🔔 Notificações\n\n';

        if (context.isMobile && !context.isPWA) {
            message += '📱 **No navegador mobile, as notificações podem ter limitações.**\n\n';
            message += '💡 **Para melhor experiência:**\n';
            message += '• Instale o EcoMida como app nativo\n';
            message += '• Notificações funcionarão perfeitamente\n\n';
            message += '🎯 **Como app nativo:**\n';
            message += '• Alertas confiáveis sobre alimentos\n';
            message += '• Acesso rápido da tela inicial\n';
            message += '• Experiência otimizada';
        } else {
            message += 'Para notificações funcionarem:\n';
            message += '• Use HTTPS (já está com Ngrok)\n';
            message += '• Permita notificações no navegador\n';
            message += '• Atualize seu navegador se necessário';
        }

        alert(message);
    }
}

function initializeNotifications() {
    // Criar instância imediatamente
    window.notificationsSimple = new NotificationsSimple();

    // Esperar pelo evento 'app-ready' ou authManager
    const waitForInitialization = async () => {
        // Opção 1: Esperar pelo evento app-ready
        return new Promise((resolve) => {
            const checkApp = () => {
                if (window.app && window.app.initialized) {
                    resolve(true);
                    return;
                }

                if (window.authManager) {
                    resolve(true);
                    return;
                }

                // Tentar novamente em 100ms
                setTimeout(checkApp, 100);
            };

            checkApp();
        });
    };

    // Inicializar quando tudo estiver pronto
    waitForInitialization().then(async () => {
        const setupResult = await window.notificationsSimple.setup();

        // Verificar login e mostrar alertas
        if (window.authManager && window.authManager.isLoggedIn && window.authManager.isLoggedIn()) {
            // Pequeno delay para garantir que os alimentos foram carregados
            setTimeout(() => {
                if (window.notificationsSimple && window.notificationsSimple.showAlertsInUI) {
                    window.notificationsSimple.showAlertsInUI();
                }
            }, 2000); // Aumentei para 2 segundos
        }
    });
}

// Iniciar de forma controlada
document.addEventListener('DOMContentLoaded', () => {
    // Iniciar após um pequeno delay para sincronização
    setTimeout(initializeNotifications, 500);
});

// Também escutar o evento app-ready
window.addEventListener('app-ready', () => {
    if (window.notificationsSimple && !window.notificationsSimple.isInitialized) {
        setTimeout(() => {
            if (window.notificationsSimple.setup) {
                window.notificationsSimple.setup().then(() => {
                    if (window.authManager && window.authManager.isLoggedIn &&
                        window.authManager.isLoggedIn() && window.notificationsSimple.showAlertsInUI) {
                        window.notificationsSimple.showAlertsInUI();
                    }
                });
            }
        }, 1000);
    }
});