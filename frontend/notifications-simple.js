console.log('🔔 NotificationsSimple carregando...');

class NotificationsSimple {
    constructor() {
        this.baseURL = `${window.location.origin}/api`;
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.isSubscribed = false;
        console.log('✅ NotificationsSimple inicializado');
    }

    async setup() {
        if (!this.isSupported) {
            console.log('❌ Notificações não suportadas neste navegador');
            return false;
        }

        try {
            await navigator.serviceWorker.register('/sw-notifications.js');
            console.log('✅ Service Worker registrado');
            
            return true;
        } catch (error) {
            console.error('❌ Erro no setup:', error);
            return false;
        }
    }

    async testNotification() {

        if (this.isMobileDevice()) {
            console.log('📱 Dispositivo mobile detectado');
            return this.testMobileNotification();
        }


        console.log('🔔 Testando notificação COMPLETA...');
        
        const swTest = await this.testServiceWorker();
        console.log('🔧 Service Worker testado:', swTest);
        
        if (!this.isSupported) {
            console.log('🔄 Usando fallback de notificação...');
            return this.testFallbackNotification();
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('✅ Permissão concedida, enviando notificação...');
                
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'SHOW_NOTIFICATION',
                        title: '🔔 EcoMida - Teste PUSH',
                        body: 'Notificações PUSH estão funcionando perfeitamente! Você receberá alertas automáticos.',
                        icon: '/images/ecomida192.png',
                        requireInteraction: true
                    });
                    console.log('✅ Notificação PUSH enviada via Service Worker');
                } else {
                    new Notification('🔔 EcoMida - Teste', {
                        body: 'Notificações funcionando! Service Worker não está controlando.',
                        icon: '/images/ecomida192.png',
                        requireInteraction: true
                    });
                    console.log('✅ Notificação direta enviada');
                }
                
                return true;
            } else {
                console.log('🔕 Permissão negada:', permission);
                alert('Permissão para notificações negada: ' + permission);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro na notificação:', error);
            return this.testFallbackNotification();
        }
    }

    async checkExpiringFoods() {
        try {
            const token = window.authManager?.getToken();
            if (!token) {
                console.log('🔐 Usuário não autenticado');
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
                console.log('📦 Alimentos próximos:', data.notifications);
                return data.notifications;
            }
            
            return [];
        } catch (error) {
            console.error('❌ Erro ao verificar alimentos:', error);
            return [];
        }
    }

    async showAlertsInUI() {
        const expiringFoods = await this.checkExpiringFoods();
        
        if (expiringFoods.length > 0) {
            this.createAlertBadge(expiringFoods.length);
        }
    }

    createAlertBadge(count) {
        this.removeAlertBadge();

        const alertBtn = document.getElementById('alert-settings-btn');
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

    async testServiceWorker() {
        try {
            console.log('🔧 Testando Service Worker...');
            
            if (!navigator.serviceWorker.controller) {
                console.log('❌ Nenhum Service Worker controlando a página');
                return false;
            }
            
            navigator.serviceWorker.controller.postMessage({
                type: 'TEST_NOTIFICATION',
                message: 'Teste do cliente'
            });
            
            console.log('✅ Mensagem enviada para Service Worker');
            return true;
        } catch (error) {
            console.error('❌ Erro ao testar Service Worker:', error);
            return false;
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    async testMobileNotification() {
        console.log('📱 Testando notificação no mobile...');
        
        if (!this.isMobileDevice()) {
            return this.testNotification(); 
        }

        if (Notification.permission === 'default') {
            const userConfirmed = confirm(
                '🔔 Para receber alertas sobre alimentos próximos do vencimento, permita notificações.\n\n' +
                'Clique em "OK" para permitir notificações.'
            );
            
            if (!userConfirmed) {
                console.log('📱 Usuário cancelou notificação no mobile');
                return false;
            }
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                const notification = new Notification('🔔 EcoMida', {
                    body: 'Notificações ativadas! Você receberá alertas quando alimentos estiverem próximos do vencimento.',
                    icon: '/images/ecomida192.png',
                    badge: '/images/ecomida192.png',
                    tag: 'mobile-test'
                });

                notification.onclick = () => {
                   
                    window.focus();
                    notification.close();
                };

                console.log('✅ Notificação mobile enviada');
                return true;
            } else {
                this.showMobilePermissionHelp();
                return false;
            }
        } catch (error) {
            console.error('❌ Erro na notificação mobile:', error);
          
            alert('📱 EcoMida\n\nNotificações configuradas! Você receberá alertas sobre alimentos próximos do vencimento.');
            return true;
        }
    }

    showMobilePermissionHelp() {
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);
        
        let message = '📱 Configuração de Notificações\n\n';
        
        if (isIOS) {
            message += 'Para ativar notificações no iPhone/iPad:\n';
            message += '1. Abra "Ajustes" → "Safari"\n';
            message += '2. Vá em "Configurações para Sites"\n';
            message += '3. Encontre ' + window.location.hostname + '\n';
            message += '4. Toque em "Notificações" e permita\n';
            message += '5. Volte aqui e tente novamente';
        } else if (isAndroid) {
            message += 'Para ativar notificações no Android:\n';
            message += '1. Toque nos 3 pontos → "Configurações do site"\n';
            message += '2. Toque em "Notificações"\n';
            message += '3. Ative "Notificações do site"\n';
            message += '4. Volte aqui e tente novamente';
        } else {
            message += 'Para ativar notificações:\n';
            message += '1. Verifique as configurações do seu navegador\n';
            message += '2. Permita notificações para este site\n';
            message += '3. Recarregue a página e tente novamente';
        }
        
        alert(message);
    }

}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🔔 Inicializando NotificationsSimple...');
        
        window.notificationsSimple = new NotificationsSimple();
        
        try {
            await window.notificationsSimple.setup();
            console.log('✅ NotificationsSimple inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
        
        if (window.authManager && window.authManager.isLoggedIn && window.authManager.isLoggedIn()) {
            setTimeout(() => {
                window.notificationsSimple.showAlertsInUI();
            }, 3000);
        }

    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationsSimple;
}

