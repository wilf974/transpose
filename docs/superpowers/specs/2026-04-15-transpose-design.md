# Design Spec — Transpose

**Date :** 2026-04-15
**Statut :** Approuvé

---

## Contexte

Application web de transposition de chants musicaux. Permet de changer la tonalité d'un chant (ex : D → C) à partir d'un texte saisi, d'un fichier TXT ou d'un PDF. Interface design, ludique, mobile-first. V1 sans compte utilisateur.

---

## Approche retenue

**Next.js full-stack + `@react-pdf/renderer` + Docker**

- Next.js API routes pour sécuriser la clé OpenAI
- `@react-pdf/renderer` pour l'export PDF côté client (léger, sans Puppeteer)
- `pdf-parse` côté serveur pour l'extraction de texte PDF
- OpenAI GPT-4o pour la transposition
- Docker pour le dev et la production

---

## Architecture

```
Transpose/
├── app/
│   ├── page.tsx                  ← Page principale
│   ├── layout.tsx
│   └── api/
│       ├── transpose/route.ts    ← Appel OpenAI, retourne JSON structuré
│       └── extract/route.ts      ← Extraction texte depuis PDF uploadé
├── components/
│   ├── InputPanel.tsx            ← Saisie texte / upload TXT / upload PDF (3 onglets)
│   ├── KeySelector.tsx           ← Tonalité source + cible (12 tonalités)
│   ├── SongPreview.tsx           ← Aperçu accords au-dessus des paroles
│   ├── ExportBar.tsx             ← Boutons PDF + TXT (apparaît après transposition)
│   └── PdfDocument.tsx           ← Template @react-pdf/renderer
├── lib/
│   ├── openai.ts                 ← Client OpenAI + prompt de transposition
│   ├── parser.ts                 ← Parse texte brut → { lyrics, chords }[]
│   └── pdfExtract.ts             ← Extraction texte PDF (pdf-parse)
├── docs/superpowers/specs/       ← Specs de design
├── Dockerfile                    ← Image production (standalone)
├── Dockerfile.dev                ← Image dev avec hot-reload
├── docker-compose.yml
├── .env.local                    ← OPENAI_API_KEY (non committé)
└── .dockerignore
```

---

## Interface utilisateur

Page unique, layout mobile-first, palette sombre/musicale.

```
┌─────────────────────────────┐
│  🎵 TRANSPOSE               │  Header minimal
├─────────────────────────────┤
│  [Coller texte]             │  InputPanel — 3 onglets :
│  [📄 TXT]  [📑 PDF]        │  Texte / TXT / PDF
├─────────────────────────────┤
│  De : [D ▾]  →  Vers : [C ▾]│  KeySelector (12 tonalités)
│          [Transposer]        │
├─────────────────────────────┤
│  Aperçu du chant transposé  │  SongPreview
│  Am        G                │  accords en couleur au-dessus des paroles
│  Amazing   grace            │
├─────────────────────────────┤
│  [⬇ PDF]      [⬇ TXT]      │  ExportBar
└─────────────────────────────┘
```

**Charte visuelle :**
- Fond `#0f0f0f`, accents violets/dorés
- Accords affichés dans une couleur distincte
- Animations skeleton → résultat pendant la transposition
- Composants 21st.dev pour dropdowns, boutons, tabs

---

## Flux de données

### 1. Extraction du texte
| Source | Méthode |
|--------|---------|
| Saisie directe | Passé tel quel |
| Upload TXT | `FileReader` côté client |
| Upload PDF | POST `/api/extract` → `pdf-parse` → texte brut |

### 2. Prompt OpenAI
```
Tu es un expert en transposition musicale.
Voici un chant avec accords (format libre ou chordpro).
Transpose tous les accords de {source} vers {cible}.
Retourne un JSON structuré :
{
  "lines": [
    { "lyrics": "Amazing grace", "chords": [{ "word": "Amazing", "chord": "Am" }] }
  ]
}
Ne modifie pas les paroles. Si un accord est ambigu, garde-le tel quel.
```

### 3. Parser (`lib/parser.ts`)
Détecte automatiquement le format :
- Ligne d'accords seuls → associée à la ligne de paroles suivante
- Format chordpro `[Am]Amazing` → extrait inline

### 4. Rendu SongPreview
Accords positionnés au-dessus du mot correspondant. Accords en couleur accent, paroles en blanc.

### 5. Export TXT
Généré côté client depuis le JSON — format accords au-dessus des paroles.

### 6. Export PDF
`@react-pdf/renderer` + `PDFDownloadLink` — même mise en page que le preview, côté client.

---

## Gestion d'erreurs

| Cas | Comportement |
|-----|-------------|
| Clé OpenAI manquante | Erreur 500 explicite au démarrage |
| OpenAI timeout / rate limit | Message "Réessayez dans quelques secondes" |
| PDF illisible ou protégé | Message "PDF non supporté, essayez TXT" |
| JSON OpenAI mal formé | Retry x1 automatique, sinon erreur affichée |
| Aucun accord détecté | Avertissement "Aucun accord trouvé, vérifiez le format" |
| Export PDF vide | Bouton désactivé avant transposition |
| Clipboard indisponible | Fallback `Blob` pour TXT |

---

## Docker

### Fichiers
| Fichier | Rôle |
|---------|------|
| `Dockerfile` | Image production — Next.js standalone, base `node:20-alpine` |
| `Dockerfile.dev` | Image dev — hot-reload via volume monté |
| `docker-compose.yml` | Stack locale : port 3000, volume `.:/app`, env_file |
| `.dockerignore` | Exclut `node_modules`, `.next`, `.env*` |

### docker-compose.yml
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    env_file:
      - .env.local
```

### Commandes
```bash
docker compose up           # Démarrer en dev
docker compose up --build   # Rebuild après changement de dépendances
docker compose down         # Arrêter
```

---

## Tests (V1)

| Type | Cible |
|------|-------|
| Unitaire | `lib/parser.ts` — chordpro, accords seuls, mixte |
| Unitaire | `lib/openai.ts` — mock OpenAI, vérifier structure JSON |
| Manuel | 3 inputs × 2-3 transpositions connues (D→C, G→E, Am→Gm) |

---

## Hors scope V1

- Authentification / bibliothèque de chants (→ V2)
- Détection automatique de la tonalité source
- Support des partitions avec notation musicale
- Mode collaboratif
