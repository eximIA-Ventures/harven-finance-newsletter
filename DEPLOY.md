# Harven Finance Newsletter — Deploy EasyPanel

## Setup no EasyPanel

### 1. Criar App
- Tipo: **Docker** (Dockerfile)
- Apontar para `apps/news-dashboard/` no repo

### 2. Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_BASE_URL=https://newsletter.harvenfinance.com.br
CRON_SECRET=gerar-um-uuid-aqui
```

### 3. Volume (persistir edições entre deploys)
```
Container path: /app/data
Host path: /data/harven-newsletter
```

### 4. Domain
- Configurar domínio no Traefik via EasyPanel
- HTTPS automático via Let's Encrypt

## Como funciona

- **Cron embutido:** O app agenda automaticamente a geração diária às 9h (America/Sao_Paulo)
- **Sem cron externo:** Tudo roda dentro do container
- **Volume `/app/data`:** Edições persistem em `editions.json`

## Geração manual

```bash
# Trigger manual (para testes)
curl -X POST https://newsletter.harvenfinance.com.br/api/newsletter/briefing \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Endpoints

| Rota | Método | Função |
|:---|:---|:---|
| `/newsletter` | GET | Página da newsletter |
| `/api/newsletter/briefing` | GET | Edições salvas (instant) |
| `/api/newsletter/briefing` | POST | Gera nova edição (pesado) |
| `/api/newsletter/preview` | GET | HTML da newsletter (email) |
