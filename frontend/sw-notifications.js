self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let data = {
        title: 'EcoMida',
        body: 'Alerta de alimento proximo do vencimento'
    };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            // Mantem payload padrao quando push nao vem em JSON.
        }
    }

    const options = {
        body: data.body || 'Alerta de alimento proximo do vencimento',
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
        data
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'EcoMida', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow('/');
            }

            return undefined;
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'TEST_NOTIFICATION') {
        self.registration.showNotification('EcoMida - Teste SW', {
            body: 'Teste do Service Worker funcionando!',
            icon: '/images/ecomida192.png'
        });
    }
});
