# EcoMida - Sistema de Gestão de Alimentos Inteligente 🌱

Um PWA (Progressive Web App) desenvolvido para reduzir o desperdício alimentar através do controle inteligente de validades. Ideal para famílias organizarem suas despensas e adotarem práticas sustentáveis no consumo diário.

## Funcionalidades Principais

* **Gestão de Alimentos:** Cadastro categorizado (Laticínios, Frutas, Verduras, Carnes, Grãos, Bebidas, Outros), cálculo automático de vencimento e controle de status (ativo, consumido, descartado).
* **Notificações Inteligentes:** Alertas push no navegador calculados em tempo real (sem persistência desnecessária no banco) e modo silencioso configurável.
* **Segurança & Perfil:** Autenticação via JWT, criptografia de senhas, gestão de sessões e configurações personalizadas.
* **Educação Sustentável:** Catálogo de dicas práticas de armazenamento embasadas em ciência, com sistema de favoritos.

## Arquitetura e Tecnologias

O projeto segue um modelo de 4 camadas: `Frontend (PWA) → Backend (Flask) → Lógica de Negócio → Banco SQLite`.

| Camada | Tecnologias Utilizadas |
| --- | --- |
| **Frontend** | HTML5, CSS3, JavaScript ES6+, Service Workers, LocalStorage, Material Icons |
| **Backend** | Python 3.9+, Flask, Flask-JWT-Extended, SQLAlchemy, Flask-CORS, Flask-Bcrypt |
| **Infraestrutura** | SQLite, Docker, Docker Compose, Nginx, Ngrok |

## Como Executar o Projeto

### Opção 1: Docker Compose (Recomendado)

A aplicação sobe com 2 containers (`backend` e `frontend`), utilizando Nginx para servir o PWA e resolver automaticamente questões de CORS.

1. Certifique-se de ter o Docker e o Docker Compose instalados.
2. Na raiz do projeto, construa e suba os containers:
```bash
docker compose up -d --build

```


3. Acesse o sistema em: **http://localhost:8080**
*(Para parar a execução, utilize `docker compose down`)*

### Opção 2: Execução Local (com Ngrok para mobile)

1. **Configure o Backend:**
```bash
git clone https://github.com/xavierrjon/EcoMida.git
cd EcoMida
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend && python app.py

```


2. **Inicie o Frontend:**
```bash
# Em um novo terminal, na pasta frontend:
python -m http.server 8080

```


3. **Exponha para acesso remoto:**
```bash
ngrok http 8080

```

> **Junte-se à luta contra o desperdício alimentar!**
> Pequenas ações no dia a dia criam grandes impactos no planeta.