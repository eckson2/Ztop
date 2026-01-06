# 🤖 SaaS DialogFlow Automation Platform

Uma plataforma empresarial completa para gerenciamento de chatbots, automação de testes e integração multicanal via WhatsApp e Dialogflow. Desenvolvida para escalar, suportando multi-inquilinos (SaaS) com painel administrativo robusto.

---

## 🚀 Funcionalidades Principais

### 🏢 Gestão SaaS & Multi-Tenancy
- **Painel Administrativo Completo**: Controle total sobre usuários, planos e permissões via interface intuitiva.
- **Controle de Acesso (RBAC)**: Hierarquia de segurança com perfis de `ADMIN` e `USER`.
- **Limites Personalizáveis**: Gestão flexível de quotas de mensagens e recursos por cliente (incluindo planos Ilimitados).

### 💬 Automação & Chatbots
- **Integração WhatsApp Oficial & Não-Oficial**: Suporte nativo a APIs como UazAPI e Evolution API.
- **Dialogflow Integration**: Conecte agentes inteligentes do Google Dialogflow para processamento de linguagem natural (NLP).
- **Webhooks Dinâmicos**: Roteamento inteligente de mensagens e eventos em tempo real.

### 🛠 Ferramentas de Teste & Diagnóstico
- **AutoTest Config**: Módulo exclusivo para testes automatizados de fluxo de conversa.
- **Simulação de Cenários**: Crie e valide jornadas de usuário sem gastar créditos reais.

---

## 💻 Tech Stack

O projeto utiliza uma arquitetura moderna, focada em performance e manutenibilidade:

### Backend
- **Node.js & Express**: API RESTful performática.
- **Prisma ORM**: Gerenciamento de banco de dados type-safe.
- **PostgreSQL**: Banco de dados relacional robusto.
- **JWT Auth**: Segurança padrão da indústria para autenticação.

### Frontend
- **React.js (Vite)**: Interface reativa e veloz.
- **TailwindCSS**: Estilização moderna e responsiva.
- **Lucide React**: Ícones vetoriais leves e consistentes.

### DevOps & Infraestrutura
- **Docker & Docker Swarm**: Containerização completa para deploy escalável e alta disponibilidade.
- **Nginx**: Proxy reverso de alta performance.
- **CI/CD Ready**: Estrutura preparada para integração contínua.

---

## 📦 Estrutura do Projeto

```
DialogFlow/
├── backend/            # API Server (Node.js)
│   ├── prisma/         # Schema do Banco de Dados
│   └── src/
│       ├── controllers # Lógica de Negócios
│       ├── routes      # Definição de Endpoints
│       └── services    # Integrações Externas (WhatsApp, Dialogflow)
│
└── frontend/           # Interface do Usuário (React)
    └── src/
        ├── pages       # Telas (Dashboard, Admin, AutoTest)
        └── components  # Componentes Reutilizáveis
```

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose

### Instalação Local

1. **Clone o repositório**
2. **Configure as variáveis de ambiente** (copie `.env.example` para `.env` no backend e frontend).
3. **Inicie com Docker Compose**:
   ```bash
   docker-compose up --build -d
   ```

### Deploy (Docker Swarm)

Para atualizar os serviços em produção:

```bash
# Backend
cd backend
docker build -t dialogbot_backend:latest .
docker service update --image dialogbot_backend:latest --force dialogbot_backend

# Frontend
cd frontend
docker build -t dialogbot_frontend:latest .
docker service update --image dialogbot_frontend:latest --force dialogbot_frontend
```

---

© 2024 TopTVS - Todos os direitos reservados.
