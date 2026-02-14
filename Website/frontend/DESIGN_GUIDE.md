<!-- DESIGN_GUIDE.md - Guide de style et tokens pour l'UI Genshin AI Mentor -->
# Genshin AI Mentor — Guide de design

Ce document rassemble les design tokens, règles de composants et recommandations pratiques pour l'UI (utiliser Tailwind v4 + variables CSS depuis `index.css`). Il complète les styles présents dans [Website/frontend/src/index.css](Website/frontend/src/index.css).

---

## 1. Résumé des tokens (source : `index.css`)

- **Background** : `--color-app-bg` = `#0b0e14`
- **Surface** : `--color-surface` = `rgba(17,24,39,0.7)`
- **Surface Muted** : `--color-surface-muted` = `rgba(17,24,39,0.45)`
- **Line / Divider** : `--color-line` = `rgba(255,255,255,0.08)`
- **Text Strong** : `--color-text-strong` = `#e8e4dc`
- **Text** : `--color-text` = `#9fa5b4`
- **Text Muted** : `--color-text-muted` = `#5a6272`
- **Accent** : `--color-accent` = `#e8c66a`
- **Accent Strong** : `--color-accent-strong` = `#d4a444`
- **Accent Soft** : `--color-accent-soft` = `rgba(212,164,68,0.12)`
- **Shadow** : `--shadow` = `0 20px 60px rgba(0,0,0,0.5)`

Rareté & éléments (extrait) :
- `--color-rarity-5` = `#d4a444`
- `--color-rarity-4` = `#a472c7`
- `--color-rarity-3` = `#53a9ff`
- éléments : `--color-pyro`, `--color-hydro`, `--color-anemo`, `--color-electro`, `--color-dendro`, `--color-cryo`, `--color-geo`, `--color-phys`
- glow radial variables : `--pyro-glow`, `--hydro-glow`, ... (utilisées pour fonds élémentaires)

Typographie :
- `--font-sans` = `Instrument Sans, system-ui, sans-serif`
- `--font-display` = `Space Grotesk, Instrument Sans, system-ui, sans-serif`

---

## 2. Règles d'usage / mapping Tailwind v4

Recommandation: exposer les tokens dans `tailwind.config.js` via `theme.extend` pour permettre l'usage Tailwind classique tout en conservant variables CSS.

Exemple (snippet conceptuel à ajouter dans `tailwind.config.js`):

```js
// tailwind.config.js (extrait)
module.exports = {
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--color-app-bg)',
          surface: 'var(--color-surface)',
          'surface-muted': 'var(--color-surface-muted)',
          accent: 'var(--color-accent)'
        },
        element: {
          pyro: 'var(--color-pyro)',
          hydro: 'var(--color-hydro)'
          // ...
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'Instrument Sans', 'system-ui'],
        sans: ['Instrument Sans', 'system-ui']
      },
      boxShadow: {
        'app-deep': 'var(--shadow)'
      }
    }
  }
}
```

Après mapping, utiliser classes comme `bg-app-surface`, `text-app-accent`, `font-display`, `shadow-app-deep`.

---

## 3. Composants & règles visuelles (exemples/pratiques)

- **Page / Root**
  - `background: var(--color-app-bg); color: var(--color-text); font-family: var(--font-sans);`

- **Carte (gi-card)**
  - Fond : `var(--color-surface)`
  - Bord : `1px solid var(--color-line)`
  - Radius : `rounded-lg` (8–12px)
  - Padding : `p-4`
  - Ombre : `box-shadow: var(--shadow)`
  - Tailwind exemple : `className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg p-4 shadow-[var(--shadow)]"`

- **Avatar / Card icon**
  - Taille recommandée : `w-24 h-24` (~96px)
  - Fallback image : `card.png` puis placeholder `https://placehold.co/96x96/1a1f2a/5a6272?text=?`

- **Élément (icon)**
  - Inline small : `h-5 w-5`
  - Overlay dans avatar : `gi-avatar__element` (bord fin + background légèrement transparent)

- **Artifact slots**
  - Thumbnail : 64x64 (`placehold.co/64x64/...` as fallback)
  - Active state : légère mise à l'échelle + `box-shadow` + bordure `var(--color-accent-soft)`

- **Glass AI panel**
  - Utiliser la classe `.glass-ai` déjà définie : `background: rgba(17,24,39,0.35); border: 1px solid rgba(212,164,68,0.18); backdrop-filter: blur(10px);`

---

## 4. Accessibilité & contrastes

- Titres et valeurs importantes : `--color-text-strong`.
- Texte secondaire / hint : `--color-text-muted` (éviter pour texte très petit). Vérifier ratio de contraste sur éléments critiques.
- Interactions (focus) : ajouter `outline` visible (ex: `outline-2 outline-[var(--color-accent)]`) pour la navigation clavier.

---

## 5. Comportement des images & robustesse (recommandé)

- Normaliser la priorité d'assets : `artifact.icon || artifact.image_url || artifact.img || artifact.image || /artifacts/<set>/<slot>.png`.
- `onError` handler doit remplacer l'`src` par le fallback approprié pour éviter images cassées.
- Appliquer la même logique robuste dans `Website/frontend/src/pages/Dashboard.jsx` et `Website/frontend/src/pages/Mentor.jsx`.

Référence : [Website/frontend/src/pages/Dashboard.jsx](Website/frontend/src/pages/Dashboard.jsx)

---

## 6. API / flux données (notes front-end)

- Normaliser les réponses d'API côté client : utiliser `payload = res?.data ?? res` partout pour tolérer `{data: [...]}` ou `[...]`.
- Vérifier `sessionStorage.getItem('user_data')` : c'est la condition qui peut rendre le front vide (redirige vers `/home`). Lors du debug, afficher un message si absent.

Référence backend : [Website/backend/api.py](Website/backend/api.py)

---

## 7. Exemples d'utilisation rapide

- Card wrapper (JSX) :

```jsx
<div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg p-4 shadow-[var(--shadow)]">
  {/* contenu */}
</div>
```

- Avatar with fallback :

```jsx
<img src={iconSrc} alt={name} onError={(e) => { e.currentTarget.src = fallbackSrc || 'https://placehold.co/96x96/1a1f2a/5a6272?text=?'; }} />
```

---

## 8. Tests & vérification

1. Lancer le front (`npm run dev`) et vérifier que `sessionStorage.user_data` est présent.
2. Ouvrir une page `Mentor` et vérifier : avatars, éléments, artifact thumbnails, et le panneau `glass-ai`.
3. Ouvrir la console réseau : vérifier les réponses `/leaderboard/{id}` et `/leaderboard/deep/{id}` ; s'assurer que la shape renvoyée est bien gérée par le client.

---

## 9. Notes additionnelles & prochaines actions recommandées

- Appliquer le mapping de tokens dans `tailwind.config.js` pour bénéficier du linting Tailwind et classes utilitaires.
- Propager la logique d'image-fallback du `Mentor.jsx` vers `Dashboard.jsx` (déjà repérée dans le code).
- Ajouter tests visuels rapides (Storybook ou snapshots) pour les cartes personnages et artifact slots.

---

Fichiers utiles :
- [Website/frontend/src/index.css](Website/frontend/src/index.css)
- [Website/frontend/src/pages/Dashboard.jsx](Website/frontend/src/pages/Dashboard.jsx)
- [Website/frontend/src/pages/Mentor.jsx](Website/frontend/src/pages/Mentor.jsx)
- [Website/backend/api.py](Website/backend/api.py)

Si tu veux, j'ajoute directement le snippet `tailwind.config.js` et j'applique la logique d'image-fallback automatique dans `Dashboard.jsx`.
