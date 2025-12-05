// profile.js - VERSÃO ATUALIZADA
console.log('👤 ProfileManager carregando...');

class ProfileManager {
    constructor() {
        this.baseURL = `${window.location.origin}/api`;
        this.currentProfile = null;
        console.log('✅ ProfileManager inicializado');
    }

    // 📥 CARREGAR PERFIL
    async loadProfile() {
        try {
            const token = window.authManager?.getToken();
            if (!token) {
                console.log('🔐 Usuário não autenticado');
                return null;
            }

            const response = await fetch(`${this.baseURL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentProfile = data.profile;
                console.log('✅ Perfil carregado:', this.currentProfile);
                return this.currentProfile;
            } else {
                throw new Error('Erro ao carregar perfil');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar perfil:', error);
            return null;
        }
    }

    // 💾 ATUALIZAR PERFIL
    async updateProfile(profileData) {
        try {
            const token = window.authManager?.getToken();
            if (!token) {
                throw new Error('Usuário não autenticado');
            }

            console.log('💾 Atualizando perfil:', profileData);

            const response = await fetch(`${this.baseURL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (response.ok) {
                this.currentProfile = data.profile;
                
                // Atualizar dados no localStorage
                if (window.authManager) {
                    window.authManager.user = data.profile;
                    localStorage.setItem('user_data', JSON.stringify(data.profile));
                }
                
                console.log('✅ Perfil atualizado:', this.currentProfile);
                return { success: true, profile: data.profile };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar perfil:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    // 🔐 ALTERAR SENHA
    async changePassword(currentPassword, newPassword) {
        try {
            const token = window.authManager?.getToken();
            if (!token) {
                throw new Error('Usuário não autenticado');
            }

            console.log('🔐 Alterando senha...');

            const response = await fetch(`${this.baseURL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Senha alterada com sucesso');
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('❌ Erro ao alterar senha:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    // 🚪 FAZER LOGOUT
    async logout() {
        try {
            const token = window.authManager?.getToken();
            
            if (token) {
                await fetch(`${this.baseURL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'ngrok-skip-browser-warning': 'true'
                    }
                });
            }
            
            // Limpar dados locais
            if (window.authManager) {
                window.authManager.logout();
            }
            
            // Recarregar a aplicação
            if (window.app) {
                window.app.currentUser = null;
                window.app.showScreen('login-screen');
                window.app.updateHeaderVisibility(false);
            }
            
            console.log('✅ Logout realizado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            // Fallback: limpar dados mesmo com erro
            if (window.authManager) {
                window.authManager.logout();
            }
            window.location.reload();
        }
    }

    // 🎨 RENDERIZAR INTERFACE DE PERFIL
    renderProfileUI() {
        this.createProfileScreen();
    }

    // 🖼️ CRIAR TELA DE PERFIL
    createProfileScreen() {
        let profileScreen = document.getElementById('profile-screen');
        
        if (!profileScreen) {
            console.log('🖼️ Criando tela de perfil no DOM...');
            profileScreen = document.createElement('section');
            profileScreen.id = 'profile-screen';
            profileScreen.className = 'screen';
            profileScreen.innerHTML = this.getProfileHTML();
            
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.appendChild(profileScreen);
                console.log('✅ Tela de perfil adicionada ao DOM');
            } else {
                console.error('❌ main-content não encontrado');
                document.body.appendChild(profileScreen);
            }
            
            this.attachProfileEvents();
        } else {
            console.log('✅ Tela de perfil já existe no DOM');
        }
        
        return profileScreen;
    }

    // 📝 HTML DA TELA DE PERFIL (SEM ACESSIBILIDADE + COM SENHA)
    getProfileHTML() {
        return `
        <div class="screen-header">
            <button class="back-btn" id="back-from-profile">
                <span class="material-icons">arrow_back</span>
            </button>
            <h2>Meu Perfil</h2>
        </div>

        <div class="profile-container">
            <form id="profile-form">
                <!-- AVATAR E INFO BÁSICA -->
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar">
                            <span class="material-icons">account_circle</span>
                        </div>
                        <h3 id="profile-username">Carregando...</h3>
                        <p id="profile-email">Carregando...</p>
                    </div>
                </div>

                <!-- INFORMAÇÕES PESSOAIS -->
                <div class="setting-group">
                    <h3 class="setting-subtitle">Informações Pessoais</h3>
                    
                    <div class="input-group">
                        <label for="profile-username-input">Nome de Usuário</label>
                        <input type="text" id="profile-username-input" required>
                    </div>
                    
                    <div class="input-group">
                        <label for="profile-email-input">Email</label>
                        <input type="email" id="profile-email-input" required>
                    </div>
                </div>

                <!-- ALTERAR SENHA -->
                <div class="setting-group">
                    <h3 class="setting-subtitle">Segurança</h3>
                    
                    <div class="input-group">
                        <label for="current-password">Senha Atual</label>
                        <input type="password" id="current-password" placeholder="Digite sua senha atual">
                    </div>
                    
                    <div class="input-group">
                        <label for="new-password">Nova Senha</label>
                        <input type="password" id="new-password" placeholder="Digite a nova senha (mín. 6 caracteres)">
                    </div>
                    
                    <div class="input-group">
                        <label for="confirm-password">Confirmar Nova Senha</label>
                        <input type="password" id="confirm-password" placeholder="Confirme a nova senha">
                    </div>
                    
                    <button type="button" id="change-password-btn" class="btn-secondary" style="margin-top: 1rem;">
                        <span class="material-icons" style="font-size: 18px;">lock_reset</span>
                        Alterar Senha
                    </button>
                </div>

                <!-- AÇÕES -->
                <div class="profile-actions">
                    <button type="submit" class="btn-primary">
                        <span class="material-icons">save</span>
                        Salvar Alterações
                    </button>
                    
                    <button type="button" id="logout-btn" class="btn-danger">
                        <span class="material-icons">logout</span>
                        Sair da Conta
                    </button>
                </div>
            </form>

            <div id="profile-feedback" class="save-feedback hidden">
                <span class="material-icons">check_circle</span>
                <span>Perfil atualizado com sucesso!</span>
            </div>
        </div>
        `;
    }

    // 🔄 ATUALIZAR FORMULÁRIO COM DADOS ATUAIS
    async updateProfileForm() {
        console.log('🔄 Atualizando formulário de perfil...');
        
        await this.loadProfile();
        
        if (!this.currentProfile) {
            console.error('❌ Perfil não carregado');
            return;
        }

        // 🔥 VERIFICAR se os elementos existem antes de atualizar
        const elements = {
            username: document.getElementById('profile-username'),
            email: document.getElementById('profile-email'),
            usernameInput: document.getElementById('profile-username-input'),
            emailInput: document.getElementById('profile-email-input')
        };

        // Atualizar apenas se os elementos existirem
        if (elements.username) {
            elements.username.textContent = this.currentProfile.username;
        }
        
        if (elements.email) {
            elements.email.textContent = this.currentProfile.email;
        }
        
        if (elements.usernameInput) {
            elements.usernameInput.value = this.currentProfile.username;
        }
        
        if (elements.emailInput) {
            elements.emailInput.value = this.currentProfile.email;
        }

        // Atualizar estatísticas
        this.updateStats();
        
        console.log('✅ Formulário de perfil atualizado');
    }

    // 👆 ADICIONAR EVENTOS
    attachProfileEvents() {
        // Botão voltar
        document.getElementById('back-from-profile').addEventListener('click', () => {
            this.hideProfile();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.confirmLogout();
        });

        // Salvar perfil
        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveProfile();
        });

        // 🔥 ALTERAR SENHA
        document.getElementById('change-password-btn').addEventListener('click', () => {
            this.handleChangePassword();
        });
    }

    // 💾 SALVAR PERFIL (HANDLER DO FORM)
    async handleSaveProfile() {
        const profileData = {
            username: document.getElementById('profile-username-input').value,
            email: document.getElementById('profile-email-input').value
        };

        const result = await this.updateProfile(profileData);
        
        if (result.success) {
            this.showProfileFeedback(true, 'Perfil atualizado com sucesso!');
            this.updateProfileForm(); // Atualizar display
        } else {
            this.showProfileFeedback(false, result.error);
        }
    }

    // 🔐 ALTERAR SENHA (HANDLER)
    async handleChangePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validações
        if (!currentPassword) {
            this.showProfileFeedback(false, 'Digite sua senha atual');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            this.showProfileFeedback(false, 'Nova senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showProfileFeedback(false, 'As senhas não coincidem');
            return;
        }

        const result = await this.changePassword(currentPassword, newPassword);
        
        if (result.success) {
            this.showProfileFeedback(true, 'Senha alterada com sucesso!');
            // Limpar campos de senha
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } else {
            this.showProfileFeedback(false, result.error);
        }
    }

    // 🚪 CONFIRMAR LOGOUT
    confirmLogout() {
        const confirmed = confirm('Tem certeza que deseja sair da sua conta?');
        if (confirmed) {
            this.logout();
        }
    }

    // ✅ FEEDBACK VISUAL
    showProfileFeedback(success, message = '') {
        const feedback = document.getElementById('profile-feedback');
        if (!feedback) return;

        if (success) {
            feedback.innerHTML = `
                <span class="material-icons" style="color: #4CAF50;">check_circle</span>
                <span>${message}</span>
            `;
            feedback.className = 'save-feedback success';
        } else {
            feedback.innerHTML = `
                <span class="material-icons" style="color: #f44336;">error</span>
                <span>${message}</span>
            `;
            feedback.className = 'save-feedback error';
        }

        feedback.classList.remove('hidden');

        setTimeout(() => {
            feedback.classList.add('hidden');
        }, 3000);
    }

    // 📱 MOSTRAR PERFIL
    showProfile() {
        console.log('📱 Mostrando tela de perfil...');
        
        // 🔥 GARANTIR que a tela existe
        const profileScreen = this.createProfileScreen();
        
        if (!profileScreen) {
            console.error('❌ Não foi possível criar a tela de perfil');
            return;
        }
        
        // 🔥 ESCONDER todas as outras telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 🔥 MOSTRAR a tela de perfil
        profileScreen.classList.add('active');
        
        // 🔥 ATUALIZAR os dados
        this.updateProfileForm();
        
        console.log('✅ Tela de perfil mostrada');
    }

    // 📱 OCULTAR PERFIL
    hideProfile() {
        document.getElementById('profile-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
    }

    // 🔒 INICIALIZAÇÃO SEGURA
    async safeInit() {
        try {
            console.log('🔒 Inicialização segura do ProfileManager...');
            
            // Aguardar o DOM estar pronto
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Criar a tela imediatamente
            this.createProfileScreen();
            
            console.log('✅ ProfileManager inicializado com segurança');
        } catch (error) {
            console.error('❌ Erro na inicialização segura:', error);
        }
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', async () => {
    console.log('👤 Inicializando ProfileManager...');
    window.profileManager = new ProfileManager();
    
    // Inicialização segura
    await window.profileManager.safeInit();
    
    console.log('✅ ProfileManager pronto!');
});