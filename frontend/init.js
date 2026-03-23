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
        this.waitForModule('auth', () => window.authManager).then(() => {
            this.initializeApp();
        });
    }
    
    waitForModule(moduleName, checkFunction, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (checkFunction()) {
                    this.modules[moduleName] = true;
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
            window.app = new EcoMidaApp();
            this.modules.app = true;
        }
        
        setTimeout(() => {
            if (window.authManager && window.authManager.isLoggedIn && 
                window.authManager.isLoggedIn()) {
                this.initializeNotificationModules();
            }
        }, 1000);
    }
    
    initializeNotificationModules() {
       
        setTimeout(() => {
            if (window.notificationsSimple && !window.notificationsSimple.isInitialized) {
                window.notificationsSimple.setup().then(() => {
                    window.notificationsSimple.showAlertsInUI();
                });
            }
            
            if (window.notificationSettings && !window.notificationSettings.isInitialized) {
                window.notificationSettings.init();
            }
            
            this.modules.notifications = true;
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.appInitializer = new AppInitializer();
    }, 300);
});