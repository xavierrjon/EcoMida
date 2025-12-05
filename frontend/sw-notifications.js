console.log('🔔 Service Worker carregado - Versão 2.0');

self.addEventListener('install', (event) => {
    console.log('✅ Service Worker instalado');
    self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker ativado');
    event.waitUntil(self.clients.claim()); 
});

self.addEventListener('push', (event) => {
    console.log('📢 Push event recebido:', event);
    
    if (!event.data) {
        console.log('❌ Push sem dados');
        return;
    }
    
    let data;
    try {
        data = event.data.json();
        console.log('📦 Dados da push:', data);
    } catch (error) {
        console.log('❌ Erro ao parsear dados, usando padrão');
        data = {
            title: 'EcoMida',
            body: 'Alerta de alimento próximo do vencimento'
        };
    }
    
    const options = {
        body: data.body || 'Alerta de alimento próximo do vencimento',
        icon: '/images/ecomida192.png',
        badge: '/images/ecomida192.png',
        tag: 'food-alert',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'Ver Alimentos',
                icon: '/images/ecomida192.png'
            },
            {
                action: 'dismiss',
                title: 'Fechar',
                icon: '/images/ecomida192.png'
            }
        ],
        data: data 
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'EcoMida', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ Notificação clicada:', event.action);
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes('/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    } else if (event.action === 'dismiss') {
      
        console.log('❌ Notificação descartada');
    } else {
        event.waitUntil(
            clients.openWindow('/').then(windowClient => {
                console.log('📍 Aplicação aberta');
            })
        );
    }
});

self.addEventListener('message', (event) => {
    console.log('📨 Mensagem do cliente:', event.data);
    if (event.data && event.data.type === 'TEST_NOTIFICATION') {
        self.registration.showNotification('EcoMida - Teste SW', {
            body: 'Teste do Service Worker funcionando!',
            icon: '/images/ecomida192.png'
        });
    }
});

self.addEventListener('push', (event) => {
    console.log('📱 Push event no mobile:', event);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let data;
    try {
        data = event.data.json();
    } catch (error) {
        data = {
            title: 'EcoMida',
            body: 'Alerta: Alimento próximo do vencimento'
        };
    }
    
    const options = {
        body: data.body || 'Alerta de alimento próximo do vencimento',
        icon: '/images/ecomida192.png',
        badge: '/images/ecomida192.png',
        tag: 'food-alert',
        requireInteraction: false, 
        data: data
    };
    
    if (isMobile) {
        options.actions = []; 
    } else {
        options.actions = [
            {
                action: 'view',
                title: 'Ver Alimentos',
                icon: '/images/ecomida192.png'
            }
        ];
        options.requireInteraction = true;
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'EcoMida', options)
    );
});