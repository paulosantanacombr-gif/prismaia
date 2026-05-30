# PRISMA LabPixel — Batch Photo Editing Agent

Agente de edição de fotografias em lote usando a API Seedream 4.5 (SiliconFlow).

## 🚀 Deploy no GitHub Pages (grátis)

### Passo 1 — Criar repositório
1. Acesse [github.com](https://github.com) e clique em **New repository**
2. Nome: `prisma-labpixel` (ou qualquer nome)
3. Marque **Public**
4. Clique em **Create repository**

### Passo 2 — Subir o arquivo
```bash
# Opção A: via interface web
# Arraste o arquivo index.html para a página do repositório

# Opção B: via Git
git init
git add index.html
git commit -m "feat: Prisma LabPixel agent"
git branch -M main
git remote add origin https://github.com/SEU_USER/prisma-labpixel.git
git push -u origin main
```

### Passo 3 — Ativar GitHub Pages
1. No repositório, vá em **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **/ (root)**
4. Clique em **Save**
5. Aguarde ~1 minuto → URL: `https://SEU_USER.github.io/prisma-labpixel`

---

## 🔑 Obter API Key

1. Acesse [platform.siliconflow.cn](https://platform.siliconflow.cn)
2. Crie uma conta gratuita
3. Vá em **API Keys → Create new key**
4. Cole a chave no app ao clicar em **Configurar**

A chave é salva no `localStorage` do navegador — nunca sai do seu dispositivo.

---

## ✨ Funcionalidades

- Upload múltiplo com drag & drop
- Edição em lote via API Seedream 4.5 / FLUX.1
- Modos: img2img, enhance, relight, bg_remove, upscale
- Export automático: **5000×5000px**, **300dpi**, **JPG**
- Download individual ou tudo de uma vez
- Presets de prompt para moda, produto, retrato, etc.
- Interface minimalista no estilo Prisma LabPixel

---

## 📦 Estrutura

```
/
└── index.html   ← app completo (single-file, zero dependências)
```

Nenhuma dependência externa além das fontes do Google Fonts.
