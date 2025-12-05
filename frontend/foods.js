class FoodsManager {
    constructor() {
        this.baseURL = `${window.location.origin}/api`;
        this.currentEditingFood = null;
        this.init();
    }

    init() {
        console.log('🍎 FoodsManager inicializado com modal de edição');
        this.attachGlobalEvents();
    }

    attachGlobalEvents() {
    }

    async loadFoods() {
        try {
            const token = window.authManager?.getToken();
            if (!token) {
                console.log('❌ Token não encontrado');
                this.showEmptyState();
                return;
            }

            console.log('🔗 Carregando alimentos...');
            const response = await fetch(`${this.baseURL}/foods`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📦 Alimentos recebidos:', data.foods);
                this.renderFoods(data.foods);
                return data.foods;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar alimentos:', error);
            this.showEmptyState();
            this.showNotification('Erro ao carregar alimentos: ' + error.message, 'error');
        }
    }

    renderFoods(foods) {
        const foodsList = document.getElementById('foods-list');
        const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab') || 'active';
        
        if (!foods || foods.length === 0) {
            this.showEmptyState();
            return;
        }

        let filteredFoods = foods.filter(food => {
            if (activeTab === 'consumed') return food.status === 'consumed';
            if (activeTab === 'discarded') return food.status === 'discarded';
            return food.status === 'active';
        });

        if (filteredFoods.length === 0) {
            this.showTabEmptyState(activeTab);
            return;
        }

        if (activeTab === 'active') {
            filteredFoods.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
        } else {
            filteredFoods.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }

        foodsList.innerHTML = filteredFoods.map((food, index) => {
            const expiryStatus = activeTab === 'active' ? this.getExpiryStatus(food.expiry_date) : '';
            const statusBadge = activeTab !== 'active' ? `
                <span class="status-badge ${food.status}">
                    <span class="material-icons" style="font-size: 16px;">
                        ${food.status === 'consumed' ? 'check_circle' : 'delete_outline'}
                    </span>
                    ${food.status === 'consumed' ? 'Consumido' : 'Descartado'}
                </span>
            ` : '';

            return `
            <div class="food-card" data-food-id="${food.id}" style="animation-delay: ${index * 0.1}s">
                <!-- CABEÇALHO -->
                <div class="food-header">
                    <div>
                        <div class="food-title">${this.escapeHtml(food.name)}</div>
                        <span class="food-category">${this.getCategoryLabel(food.food_type)}</span>
                    </div>
                    ${statusBadge}
                </div>
                
                <!-- INFORMAÇÕES -->
                <div class="food-info-grid">
                    <div class="info-item">
                        <span class="info-label">Quantidade</span>
                        <span class="info-value">${this.formatQuantityDisplay(food.quantity, food.unit)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Validade</span>
                        <span class="info-value ${expiryStatus}">
                            ${activeTab === 'active' 
                                ? this.formatExpiryDate(
                                    food.expiry_date, 
                                    food.days_until_expiry,
                                    food.expiry_message,
                                    food.expiry_date_display  // ← NOVO: passar campo display
                                )
                                : (food.expiry_date_display || new Date(food.expiry_date).toLocaleDateString('pt-BR'))
                            }
                        </span>
                    </div>
                </div>
                
                <!-- BOTÕES DE AÇÃO -->
                <div class="food-actions">
                    ${activeTab === 'active' ? `
                        <button class="action-btn btn-consumed consume-food" data-food-id="${food.id}">
                            <span class="material-icons">check_circle</span>
                            Consumido
                        </button>
                        <button class="action-btn btn-discarded discard-food" data-food-id="${food.id}">
                            <span class="material-icons">delete_outline</span>
                            Descartado
                        </button>
                    ` : `
                        <button class="action-btn btn-reactivate reactivate-food" data-food-id="${food.id}">
                            <span class="material-icons">refresh</span>
                            Reativar
                        </button>
                    `}
                </div>
            </div>
            `;
        }).join('');

        this.attachFoodEvents();
    }

    attachFoodEvents() {
        document.querySelectorAll('.food-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.action-btn')) return;
                
                const foodId = card.getAttribute('data-food-id');
                this.openEditModal(foodId);
            });
        });

        document.querySelectorAll('.consume-food').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const foodId = e.currentTarget.getAttribute('data-food-id');
                this.consumeFood(foodId);
            });
        });

        document.querySelectorAll('.discard-food').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const foodId = e.currentTarget.getAttribute('data-food-id');
                this.discardFood(foodId);
            });
        });

        document.querySelectorAll('.reactivate-food').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const foodId = e.currentTarget.getAttribute('data-food-id');
                this.reactivateFood(foodId);
            });
        });
    }

    async consumeFood(foodId) {
        if (!confirm('Marcar este alimento como consumido?')) return;

        try {
            const token = window.authManager?.getToken();
            const response = await fetch(`${this.baseURL}/foods/${foodId}/consume`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                this.showNotification('Alimento marcado como consumido!', 'success');
                this.loadFoods();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao marcar como consumido');
            }
        } catch (error) {
            console.error('❌ Erro ao consumir alimento:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async discardFood(foodId) {
        if (!confirm('Marcar este alimento como descartado?')) return;

        try {
            const token = window.authManager?.getToken();
            const response = await fetch(`${this.baseURL}/foods/${foodId}/discard`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                this.showNotification('Alimento marcado como descartado!', 'success');
                this.loadFoods();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao marcar como descartado');
            }
        } catch (error) {
            console.error('❌ Erro ao descartar alimento:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async reactivateFood(foodId) {
        if (!confirm('Reativar este alimento?')) return;

        try {
            const token = window.authManager?.getToken();
            const response = await fetch(`${this.baseURL}/foods/${foodId}/reactivate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                this.showNotification('Alimento reativado!', 'success');
                this.loadFoods();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao reativar alimento');
            }
        } catch (error) {
            console.error('❌ Erro ao reativar alimento:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async openEditModal(foodId) {
        try {
            const token = window.authManager?.getToken();
            const response = await fetch(`${this.baseURL}/foods`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const food = data.foods.find(f => f.id == foodId);
                
                if (food) {
                    this.showEditModal(food);
                } else {
                    throw new Error('Alimento não encontrado');
                }
            } else {
                throw new Error('Erro ao carregar alimentos');
            }
        } catch (error) {
            console.error('❌ Erro ao abrir modal:', error);
            this.showNotification('Erro ao carregar alimento', 'error');
        }
    }

    showEditModal(food) {
        this.currentEditingFood = food;
        
        const modalHTML = `
            <div class="modal-overlay" id="edit-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Editar Alimento</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    
                    <form class="edit-form" id="edit-food-form">
                        <div class="input-group">
                            <label for="edit-food-name">Nome do alimento</label>
                            <input type="text" id="edit-food-name" value="${this.escapeHtml(food.name)}" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label for="edit-food-quantity">Quantidade</label>
                                <input type="number" id="edit-food-quantity" value="${food.quantity}" step="0.1" min="0.1" required>
                            </div>
                            <div class="input-group">
                                <label for="edit-food-unit">Unidade</label>
                                <select id="edit-food-unit">
                                    <option value="unidades" ${food.unit === 'unidades' ? 'selected' : ''}>Unidades</option>
                                    <option value="kg" ${food.unit === 'kg' ? 'selected' : ''}>Quilogramas (kg)</option>
                                    <option value="g" ${food.unit === 'g' ? 'selected' : ''}>Gramas (g)</option>
                                    <option value="litros" ${food.unit === 'litros' ? 'selected' : ''}>Litros (L)</option>
                                    <option value="ml" ${food.unit === 'ml' ? 'selected' : ''}>Mililitros (ml)</option>
                                    <option value="pacotes" ${food.unit === 'pacotes' ? 'selected' : ''}>Pacotes</option>
                                    <option value="caixas" ${food.unit === 'caixas' ? 'selected' : ''}>Caixas</option>
                                    <option value="potes" ${food.unit === 'potes' ? 'selected' : ''}>Potes</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label for="edit-food-expiry">Data de validade</label>
                                <input type="date" id="edit-food-expiry" value="${food.expiry_date}" required>
                            </div>
                            <div class="input-group">
                                <label for="edit-food-type">Tipo/Categoria</label>
                                <select id="edit-food-type">
                                    <option value="laticinios" ${food.food_type === 'laticinios' ? 'selected' : ''}>Laticínios</option>
                                    <option value="frutas" ${food.food_type === 'frutas' ? 'selected' : ''}>Frutas</option>
                                    <option value="verduras" ${food.food_type === 'verduras' ? 'selected' : ''}>Verduras</option>
                                    <option value="carnes" ${food.food_type === 'carnes' ? 'selected' : ''}>Carnes</option>
                                    <option value="graos" ${food.food_type === 'graos' ? 'selected' : ''}>Grãos</option>
                                    <option value="bebidas" ${food.food_type === 'bebidas' ? 'selected' : ''}>Bebidas</option>
                                    <option value="outros" ${food.food_type === 'outros' ? 'selected' : ''}>Outros</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" id="cancel-edit">Cancelar</button>
                            <button type="submit" class="btn-save">Salvar Alterações</button>
                        </div>
                        
                        <button type="button" class="btn-delete-modal" id="delete-food-modal">
                            <span class="material-icons">delete</span>
                            Excluir Alimento
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.attachModalEvents();
    }

    attachModalEvents() {
        const modal = document.getElementById('edit-modal');
        const form = document.getElementById('edit-food-form');
        const cancelBtn = document.getElementById('cancel-edit');
        const closeBtn = document.querySelector('.close-modal');
        const deleteBtn = document.getElementById('delete-food-modal');

        const closeModal = () => {
            modal.remove();
            this.currentEditingFood = null;
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFoodEdit();
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir este alimento?')) {
                this.deleteFood(this.currentEditingFood.id);
                closeModal();
            }
        });
    }

    async saveFoodEdit() {
        try {
            const token = window.authManager?.getToken();
            const foodData = {
                name: document.getElementById('edit-food-name').value,
                quantity: parseFloat(document.getElementById('edit-food-quantity').value),
                unit: document.getElementById('edit-food-unit').value,
                expiry_date: document.getElementById('edit-food-expiry').value,
                food_type: document.getElementById('edit-food-type').value
            };

            const response = await fetch(`${this.baseURL}/foods/${this.currentEditingFood.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(foodData)
            });

            if (response.ok) {
                this.showNotification('Alimento atualizado com sucesso!', 'success');
                document.getElementById('edit-modal').remove();
                this.currentEditingFood = null;
                this.loadFoods();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao atualizar alimento');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar edição:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async deleteFood(foodId) {
        try {
            const token = window.authManager?.getToken();
            const response = await fetch(`${this.baseURL}/foods/${foodId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                this.showNotification('Alimento excluído com sucesso!', 'success');
                this.loadFoods();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir alimento');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir alimento:', error);
            this.showNotification(error.message, 'error');
        }
    }
    formatQuantityDisplay(quantity, unit) {
        const unitsMap = {
            'unidades': 'unid',
            'kg': 'kg',
            'g': 'g', 
            'litros': 'L',
            'ml': 'ml',
            'pacotes': 'pct',
            'caixas': 'cx',
            'potes': 'pt',
            'outro': 'unid'
        };
        
        const shortUnit = unitsMap[unit] || unit;
        const formattedQuantity = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
        
        return `${formattedQuantity} ${shortUnit}`;
    }

    formatExpiryDate(dateString, daysUntilExpiry = null, expiryMessage = null, expiryDateDisplay = null) {
        console.log('🔥 formatExpiryDate recebeu:', { 
            dateString, 
            daysUntilExpiry, 
            expiryMessage,
            expiryDateDisplay,
            'tipo expiryMessage': typeof expiryMessage,
            'tipo expiryDateDisplay': typeof expiryDateDisplay
        });
        
        if (expiryDateDisplay && typeof expiryDateDisplay === 'string') {
            console.log('🔥 Usando expiry_date_display do backend:', expiryDateDisplay);
            
            if (expiryMessage && typeof expiryMessage === 'string') {
                return `${expiryDateDisplay} ${expiryMessage}`;
            }
            
            if (daysUntilExpiry !== null && daysUntilExpiry !== undefined) {
                return `${expiryDateDisplay} ${this.getExpiryMessageFromDays(daysUntilExpiry)}`;
            }
            
            const days = this.calculateDaysUntilExpiryLocal(new Date(dateString));
            return `${expiryDateDisplay} ${this.getExpiryMessageFromDays(days)}`;
        }
        
        const formattedDate = this.formatDateBrazilian(dateString);
        console.log('🔥 Data formatada localmente:', formattedDate);
        
        if (expiryMessage && typeof expiryMessage === 'string') {
            console.log('🔥 Usando expiry_message do backend:', expiryMessage);
            return `${formattedDate} ${expiryMessage}`;
        }
        
        let days = daysUntilExpiry;
        if (days === null || days === undefined) {
            days = this.calculateDaysUntilExpiryLocal(new Date(dateString));
        }
        
        return `${formattedDate} ${this.getExpiryMessageFromDays(days)}`;
    }

    formatDateBrazilian(dateString) {
        if (!dateString) return '';
        
        console.log('🔥 formatDateBrazilian chamado com:', dateString);
        
        try {
       
            const date = new Date(dateString);
            
            const day = date.getUTCDate();
            const month = date.getUTCMonth() + 1;
            const year = date.getUTCFullYear();
            
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        } catch (error) {
            console.error('❌ Erro ao formatar data:', error);
            return dateString; 
        }
    }

    getExpiryMessageFromDays(days) {
        if (days < 0) {
            return `(Vencido há ${Math.abs(days)} dias)`;
        } else if (days === 0) {
            return '(Vence hoje!)';
        } else if (days === 1) {
            return '(Vence amanhã!)';
        } else if (days === 2) {
            return '(Vence depois de amanhã!)';
        } else if (days <= 7) {
            return `(Vence em ${days} dias)`;
        } else {
            return `(Vence em ${days} dias)`;
        }
    }

    calculateDaysUntilExpiryLocal(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        
        const diffMs = expiry - today;
        return Math.round(diffMs / (1000 * 60 * 60 * 24));
    }

    getExpiryStatus(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'expired';
        if (diffDays <= 3) return 'expiring';
        return 'ok';
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
        const foodsList = document.getElementById('foods-list');
        if (foodsList) {
            foodsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">kitchen</span>
                    <p>Nenhum alimento cadastrado</p>
                    <p class="empty-state-hint">Toque no botão + para adicionar</p>
                </div>
            `;
        }
    }

    showTabEmptyState(tab) {
        const foodsList = document.getElementById('foods-list');
        const messages = {
            'active': 'Nenhum alimento ativo',
            'consumed': 'Nenhum alimento consumido',
            'discarded': 'Nenhum alimento descartado'
        };
        
        foodsList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">${tab === 'active' ? 'kitchen' : 'inventory_2'}</span>
                <p>${messages[tab] || 'Nenhum alimento'}</p>
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
    window.foodsManager = new FoodsManager();
    console.log('🍎 FoodsManager carregado com modal de edição');
});