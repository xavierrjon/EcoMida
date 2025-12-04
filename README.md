# 🌱 EcoMida - Sistema de Gestão de Alimentos Inteligente

Um sistema PWA (Progressive Web App) desenvolvido em Flask (backend) e PWA nativo (frontend) com foco em reduzir o desperdício alimentar através do controle inteligente de validades. Ideal para famílias que desejam organizar sua despensa, controlar prazos de validade e adotar práticas sustentáveis no consumo de alimentos.

## ✨ Funcionalidades

### 🔐 **Sistema de Autenticação Segura**
- Registro e login de usuários com JWT (JSON Web Tokens)
- Criptografia de senhas com Flask-Bcrypt
- Gestão segura de sessões
- Logout com confirmação

### 🍎 **Gerenciamento Inteligente de Alimentos**
- Cadastro completo: nome, quantidade, validade, categoria
- Controle de status: ativos, consumidos, descartados
- Cálculo automático de dias até o vencimento
- 7 categorias organizadas: Laticínios, Frutas, Verduras, Carnes, Grãos, Bebidas, Outros

### 💡 **Sistema de Dicas Educativas**
- Catálogo organizado por categorias de alimentos
- Dicas especializadas de armazenamento
- Sistema de favoritos para dicas importantes
- Conteúdo educativo prático e aplicável

### 🔔 **Sistema de Notificações Inteligentes**
- Alertas automáticos de alimentos próximos do vencimento
- Configurações personalizáveis por usuário
- Horário silencioso para não perturbar
- Notificações push no navegador (PWA)
- **Lógica especial:** Notificações calculadas em tempo real sem persistência no banco

### 👤 **Perfil do Usuário Personalizado**
- Edição de dados pessoais
- Alteração segura de senha
- Configurações personalizadas de notificação
- Histórico completo de ações

## 🧠 Arquitetura do Sistema

### 📐 **Modelo 4 Camadas**
```
Frontend (PWA) → Backend (Flask) → Lógica de Negócio → Banco SQLite
```

### 🏗️ **Tecnologias Utilizadas**

#### **Frontend (PWA)**
- HTML5 (Estrutura semântica)
- CSS3 (Estilização responsiva)
- JavaScript ES6+ (Lógica da aplicação)
- Service Workers (Notificações push e funcionalidades offline)
- Material Icons (Interface visual)
- LocalStorage (Armazenamento local)

#### **Backend (Flask)**
- Python 3.9+ (Linguagem principal)
- Flask (Framework web minimalista)
- Flask-JWT-Extended (Autenticação com tokens)
- Flask-SQLAlchemy (ORM para banco de dados)
- Flask-CORS (Controle de requisições entre domínios)
- Flask-Bcrypt (Criptografia de senhas)
- Flask-Migrate (Controle de migrações)

#### **Banco de Dados & Infra**
- SQLite (Banco relacional para desenvolvimento)
- SQLAlchemy (ORM e gestão de modelos)
- Ngrok (Tunneling para testes em dispositivos móveis)

## 📝 Motivação

O EcoMida nasceu da necessidade de combater um problema global: o desperdício alimentar. Estima-se que 1/3 de toda comida produzida no mundo é desperdiçada. Este sistema busca empoderar famílias com ferramentas práticas para:
- Controlar prazos de validade de forma proativa
- Aprender técnicas adequadas de armazenamento
- Tomar decisões conscientes sobre consumo
- Reduzir o impacto ambiental do desperdício

## 🖼️ Interface

A interface foi projetada com foco em **usabilidade e acessibilidade**:
- Design responsivo que funciona em mobile, tablet e desktop
- Experiência PWA (instalável como app nativo)
- Navegação intuitiva e fluxos otimizados
- Feedback visual claro para ações do usuário
- Modo offline com Service Workers

## 🚀 Tecnologias Utilizadas

### **Core Stack**
- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Backend:** Python 3.9+, Flask
- **Banco de Dados:** SQLite (dev), SQLAlchemy ORM
- **Autenticação:** JWT, Flask-Bcrypt

### **Recursos Avançados**
- **PWA:** Service Workers, Manifest, Cache API
- **Notificações:** Web Push API, Background Sync
- **UI/UX:** Material Design, Responsive Design
- **Dev Tools:** Git, Ngrok, Flask Debug Toolbar

## ✅ Requisitos do Sistema

### **Para Desenvolvimento:**
- Python 3.9 ou superior
- pip (gerenciador de pacotes Python)
- Navegador moderno (Chrome 70+, Firefox 65+, Edge 79+)
- Git (para controle de versão)

## 📦 Como Rodar Localmente

### **1. Clone o repositório:**
```bash
git clone https://github.com/xavierrjon/EcoMida.git
cd EcoMida
```

### **2. Configure o ambiente virtual:**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### **3. Instale as dependências:**
```bash
pip install -r backend/requirements.txt
```

### **4. Execute o servidor backend:**
```bash
cd backend
python app.py
```

O backend Flask estará rodando em: **http://localhost:5000**

### **5. Execute o frontend PWA:**
Abra o arquivo `frontend/index.html` diretamente no navegador ou use um servidor simples:

```bash
# Na pasta frontend, execute:
python -m http.server 8080
```

### **6. Acesse a aplicação:**
- **Frontend PWA:** http://localhost:8080
- **Backend API:** http://localhost:5000

## 📊 Diferenciais do EcoMida

### **1. Sustentabilidade como Foco**
- Combate direto ao desperdício de alimentos
- Conscientização ambiental integrada
- Práticas sustentáveis incentivadas

### **2. Experiência Mobile-First**
- PWA instalável como app nativo
- Funciona offline
- Notificações push
- Performance otimizada

### **3. Inteligência Proativa**
- Sistema de alertas automáticos
- Cálculos em tempo real
- Recomendações personalizadas
- Histórico de aprendizado

### **4. Conteúdo Educativo**
- Dicas práticas baseadas em ciência
- Organização por categorias
- Sistema de favoritos
- Atualizações periódicas

## 👥 Integrantes do Grupo

| Função      | Nome                | Responsabilidade          |
|-------------|---------------------|----------------------------|
| Dev 1       | Johnny Xavier       | Backend                    |
| Dev 2       | Raíssa Martins      | Frontend                   |
| Revisor 1   | Emelly Cristina     | Revisão Backend            |
| Revisor 2   | Nathalya Christine  | Revisão Frontend           |
| Revisor 3   | Rhanna Karoline     | Revisão Geral              |

## 🙏 Agradecimentos

Agradecemos a todos que contribuíram para este projeto, especialmente:

- **Nossas famílias beta testers** pelo feedback valioso
- **Professor e orientador Walter Jonas** pelo suporte técnico

---

<div align="center">

## 🌱 **Junte-se à luta contra o desperdício alimentar!**

**"Pequenas ações no dia a dia criam grandes impactos no planeta."**

[⬆ Voltar ao topo](#-ecomida---sistema-de-gestão-de-alimentos-inteligente)

</div>
