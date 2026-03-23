// Verificar se estamos em PWA
const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && navigator.standalone);

if (isPWA) {
    // Forçar reload dos scripts importantes no PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.update(); // Forçar atualização
            });
        });
    }
}

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) {
        return;
    }

    let data;
    try {
        data = event.data.json();
    } catch (error) {
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
    } else {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'TEST_NOTIFICATION') {
        self.registration.showNotification('EcoMida - Teste SW', {
            body: 'Teste do Service Worker funcionando!',
            icon: '/images/ecomida192.png'
        });
    }
});

self.addEventListener('push', (event) => {
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