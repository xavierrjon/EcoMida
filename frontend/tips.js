class TipsManager {
    constructor() {
        this.baseURL = `${window.location.origin}/api`;
        this.favoriteTips = new Set();
        this.allTips = [];
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        this.attachTipEvents();
    }

    async loadTips() {
        try {
            const headers = {
                'ngrok-skip-browser-warning': 'true'
            };
            
            // Adicionar token de autenticação se disponível
            const token = window.authManager?.getToken() || localStorage.getItem('auth_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${this.baseURL}/tips`, {
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                this.allTips = data.tips || [];
                // Atualizar conjunto de favoritos baseado na resposta do servidor
                this.favoriteTips = new Set(
                    this.allTips
                        .filter(tip => tip.is_favorite)
                        .map(tip => tip.id)
                );
                this.renderTips(this.allTips);
                return this.allTips;
            } else {
                throw new Error(`Erro ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dicas:', error);
            this.showEmptyState();
            this.showNotification('Erro ao carregar dicas', 'error');
        }
    }

    renderTips(tips) {
        const tipsList = document.getElementById('tips-list');
        
        if (!tips || tips.length === 0) {
            this.showEmptyState();
            return;
        }

        let filteredTips = tips;
        if (this.currentCategory !== 'all') {
            if (this.currentCategory === 'favorites') {
                filteredTips = tips.filter(tip => this.favoriteTips.has(tip.id));
            } else {
                filteredTips = tips.filter(tip => tip.food_category === this.currentCategory);
            }
        }

        if (filteredTips.length === 0) {
            this.showCategoryEmptyState();
            return;
        }

        tipsList.innerHTML = filteredTips.map((tip, index) => `
            <div class="tip-card" data-tip-id="${tip.id}" style="animation-delay: ${index * 0.1}s">
                <div class="tip-header">
                    <h3 class="tip-title">${this.escapeHtml(tip.title)}</h3>
                    <div class="tip-actions">
                        <button class="icon-btn favorite-btn ${this.favoriteTips.has(tip.id) ? 'favorited' : ''}" 
                                data-tip-id="${tip.id}" title="${this.favoriteTips.has(tip.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                            <span class="material-icons">${this.favoriteTips.has(tip.id) ? 'favorite' : 'favorite_border'}</span>
                        </button>
                    </div>
                </div>
                
                <div class="tip-category">
                    <span class="category-badge">${this.getCategoryLabel(tip.food_category)}</span>
                </div>
                
                <div class="tip-content">
                    ${this.formatTipContent(tip.content)}
                </div>
            </div>
        `).join('');

        this.attachTipCardEvents();
    }

    formatTipContent(content) {
        return content.split('\n').map(paragraph => 
            paragraph.trim() ? `<p>${this.escapeHtml(paragraph)}</p>` : ''
        ).join('');
    }

    async toggleFavorite(tipId) {
        try {
            const token = window.authManager?.getToken() || localStorage.getItem('auth_token');
            if (!token) {
                this.showNotification('É necessário estar autenticado para favoritar', 'error');
                return;
            }

            const response = await fetch(`${this.baseURL}/tips/${tipId}/favorite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Atualizar estado local baseado na resposta
                if (data.is_favorite) {
                    this.favoriteTips.add(tipId);
                } else {
                    this.favoriteTips.delete(tipId);
                }
                
                // Em "Favoritas", o item pode sair da lista ao desfavoritar.
                if (this.currentCategory === 'favorites') {
                    this.renderTips(this.allTips);
                } else {
                    this.updateFavoriteButton(tipId);
                }
                this.showNotification(data.message, 'success');
            } else if (response.status === 401) {
                this.showNotification('Sessão expirada, por favor recarregue a página', 'error');
            } else {
                throw new Error(`Erro ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Erro ao favoritar dica:', error);
            this.showNotification('Erro ao favoritar dica', 'error');
        }
    }

    updateFavoriteButton(tipId) {
        const favoriteBtn = document.querySelector(`.favorite-btn[data-tip-id="${tipId}"]`);
        if (favoriteBtn) {
            const icon = favoriteBtn.querySelector('.material-icons');
            if (this.favoriteTips.has(tipId)) {
                favoriteBtn.classList.add('favorited');
                favoriteBtn.title = 'Remover dos favoritos';
                icon.textContent = 'favorite';
            } else {
                favoriteBtn.classList.remove('favorited');
                favoriteBtn.title = 'Adicionar aos favoritos';
                icon.textContent = 'favorite_border';
            }
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.category-btn[data-category="${category}"]`).classList.add('active');
        
        this.loadTips();
    }

    attachTipEvents() {
        document.addEventListener('click', (e) => {
            const categoryBtn = e.target.closest('.category-btn');
            if (categoryBtn) {
                const category = categoryBtn.getAttribute('data-category');
                this.filterByCategory(category);
            }
        });
    }

    attachTipCardEvents() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tipId = parseInt(e.currentTarget.getAttribute('data-tip-id'));
                this.toggleFavorite(tipId);
            });
        });
    }

    getCategoryLabel(category) {
        const categories = {
            'laticinios': 'Laticínios',
            'frutas': 'Frutas',
            'verduras': 'Verduras',
            'carnes': 'Carnes',
            'graos': 'Grãos',
            'bebidas': 'Bebidas',
            'outros': 'Outros',
            'favorites': 'Favoritas'
        };
        return categories[category] || category;
    }

    showEmptyState() {
        const tipsList = document.getElementById('tips-list');
        tipsList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">tips_and_updates</span>
                <p>Nenhuma dica disponível</p>
                <p class="empty-state-hint">As dicas aparecerão aqui em breve</p>
            </div>
        `;
    }

    showCategoryEmptyState() {
        const tipsList = document.getElementById('tips-list');
        if (this.currentCategory === 'favorites') {
            tipsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">favorite_border</span>
                    <p>Nenhuma dica favoritada</p>
                    <p class="empty-state-hint">Toque no coração para adicionar favoritas</p>
                </div>
            `;
            return;
        }

        const categoryLabel = this.getCategoryLabel(this.currentCategory);
        tipsList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">search</span>
                <p>Nenhuma dica para ${categoryLabel}</p>
                <p class="empty-state-hint">Tente outra categoria</p>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.tipsManager = new TipsManager();
    window.tipsManager.loadTips();
});
