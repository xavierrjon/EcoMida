class TipsManager {
    constructor() {
        this.baseURL = `${window.location.origin}/api`;
        this.favoriteTips = new Set();
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        this.loadFavorites();
        this.attachTipEvents();
    }

    async loadTips() {
        try {
            const response = await fetch(`${this.baseURL}/tips`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderTips(data.tips);
                return data.tips;
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
            filteredTips = tips.filter(tip => tip.food_category === this.currentCategory);
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

    toggleFavorite(tipId) {
        if (this.favoriteTips.has(tipId)) {
            this.favoriteTips.delete(tipId);
        } else {
            this.favoriteTips.add(tipId);
        }
        
        this.saveFavorites();
        this.updateFavoriteButton(tipId);
        this.showNotification(
            this.favoriteTips.has(tipId) ? 'Dica adicionada aos favoritos!' : 'Dica removida dos favoritos!',
            'success'
        );
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

    saveFavorites() {
        localStorage.setItem('favoriteTips', JSON.stringify([...this.favoriteTips]));
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('favoriteTips');
            if (saved) {
                this.favoriteTips = new Set(JSON.parse(saved));
            }
        } catch (error) {
            console.error('❌ Erro ao carregar favoritos:', error);
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
            if (e.target.classList.contains('category-btn')) {
                const category = e.target.getAttribute('data-category');
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
            'outros': 'Outros'
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

    async loadTips() {
        try {
            const response = await fetch(`${this.baseURL}/tips`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderTips(data.tips || data); 
                return data.tips || data;
            } else {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dicas:', error);
            this.showEmptyState();
            this.showNotification('Erro ao carregar dicas: ' + error.message, 'error');
        }
    }

    getFavoriteTips(allTips) {
        return allTips.filter(tip => this.favoriteTips.has(tip.id));
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
                filteredTips = this.getFavoriteTips(tips);
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
                    <span class="category-badge ${tip.food_category}">${this.getCategoryLabel(tip.food_category)}</span>
                </div>
                
                <div class="tip-content">
                    ${this.formatTipContent(tip.content)}
                </div>
            </div>
        `).join('');

        this.attachTipCardEvents();
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

    showCategoryEmptyState() {
        const tipsList = document.getElementById('tips-list');
        let message = '';
        let icon = 'search';
        let hint = 'Tente outra categoria';

        if (this.currentCategory === 'favorites') {
            message = 'Nenhuma dica favoritada';
            icon = 'favorite_border';
            hint = 'Toque no ❤️ para favoritar dicas';
        } else {
            const categoryLabel = this.getCategoryLabel(this.currentCategory);
            message = `Nenhuma dica para ${categoryLabel}`;
        }

        tipsList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">${icon}</span>
                <p>${message}</p>
                <p class="empty-state-hint">${hint}</p>
            </div>
        `;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    window.tipsManager = new TipsManager();
});