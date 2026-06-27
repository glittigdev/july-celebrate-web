# june-celebrate-web

Frontend da aplicação June Celebrate construído com Vue 3, Vite, Vue Router, Pinia e Vuetify.

## Requisitos

- Node.js 20+
- npm

## Instalação

```sh
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` com base em `.env.example`.

```sh
cp .env.example .env
```

Variáveis disponíveis:

- `VITE_API_BASE_URL`: URL base da API consumida pelo frontend.

Exemplo:

```sh
VITE_API_BASE_URL=https://api.seu-dominio.com
```

## Desenvolvimento local

```sh
npm run dev
```

## Build de produção

```sh
npm run build
```

## Preview local do build

```sh
npm run preview
```

## Validações úteis

```sh
npm run lint
npm run type-check
npm run test:unit
```

## Deploy na Vercel

Configuração recomendada no projeto da Vercel:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Variáveis de ambiente que precisam ser cadastradas na Vercel:

- `VITE_API_BASE_URL`

O arquivo `vercel.json` já inclui rewrite para SPA, permitindo navegação com Vue Router em `history mode`.
