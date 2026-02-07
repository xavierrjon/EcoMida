class AppInitializer {
    constructor() {
        this.modules = {
            auth: false,
            app: false,
            foods: false,
            notifications: false,
            settings: false
        };
        
        this.init();
    }
    
    init() {
        console.log('🔧 Inicializando módulos na ordem correta...');
        
        this.waitForModule('auth', () => window.authManager).then(() => {
            console.log('✅ AuthManager pronto');
            
            this.initializeApp();
        });
    }
    
    waitForModule(moduleName, checkFunction, timeout = 5000) {
        return new Promise((resolve, reject) => {
            console.log(`⏳ Aguardando ${moduleName}...`);
            
            const startTime = Date.now();
            
            const check = () => {
                if (checkFunction()) {
                    this.modules[moduleName] = true;
                    console.log(`✅ ${moduleName} carregado`);
                    resolve();
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    console.warn(`⚠️ Timeout esperando por ${moduleName}`);
                    reject(new Error(`Timeout para ${moduleName}`));
                    return;
                }
                
                setTimeout(check, 100);
            };
            
            check();
        });
    }
    
    initializeApp() {
        if (!window.app) {
            console.log('🚀 Inicializando EcoMidaApp...');
            window.app = new EcoMidaApp();
            this.modules.app = true;
        }
        
        setTimeout(() => {
            if (window.authManager && window.authManager.isLoggedIn && 
                window.authManager.isLoggedIn()) {
                console.log('👤 Usuário logado, inicializando módulos adicionais...');
                
                this.initializeNotificationModules();
            }
        }, 1000);
    }
    
    initializeNotificationModules() {
       
        setTimeout(() => {
            console.log('🔔 Inicializando módulos de notificação...');
            
            if (window.notificationsSimple && !window.notificationsSimple.isInitialized) {
                console.log('🔄 Forçando inicialização do NotificationsSimple');
                window.notificationsSimple.setup().then(() => {
                    window.notificationsSimple.showAlertsInUI();
                });
            }
            
            if (window.notificationSettings && !window.notificationSettings.isInitialized) {
                console.log('🔄 Forçando inicialização do NotificationSettings');
                window.notificationSettings.init();
            }
            
            this.modules.notifications = true;
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, iniciando inicializador...');
    
    setTimeout(() => {
        window.appInitializer = new AppInitializer();
    }, 300);
});