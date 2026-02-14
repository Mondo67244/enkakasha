<!-- DESIGN_GUIDE.md - Guide de style et tokens pour l'UI Genshin AI Mentor -->
# Genshin AI Mentor — Guide de design (v2 - Light/Dark & Responsive)

Ce document rassemble les design tokens, règles de composants et recommandations pratiques pour l'UI. Il reflète l'implémentation actuelle basée sur **Tailwind CSS** et les **Variables CSS natives** pour le support du double thème (Clair/Sombre).

Sources : [Website/frontend/src/index.css](Website/frontend/src/index.css) et [Website/frontend/src/genshin-cards.css](Website/frontend/src/genshin-cards.css).

---

## 1. Design Tokens (Theming)

L'application utilise des variables CSS définies dans `:root` (Light Mode) et surchargées dans `.dark` (Dark Mode).

### Couleurs Principales
| Token | Rôle | Valeur Light | Valeur Dark |
| :--- | :--- | :--- | :--- |
| `--color-app-bg` | Fond d'application | `#f5f3ef` (Crème) | `#0b0e14` (Deep Blue) |
| `--color-surface` | Conteneurs principaux | `rgba(255,255,255,0.9)` | `rgba(17,24,39,0.7)` |
| `--color-surface-muted` | Éléments secondaires | `rgba(255,255,255,0.6)` | `rgba(17,24,39,0.45)` |
| `--color-line` | Bordures subtiles | `rgba(0,0,0,0.1)` | `rgba(255,255,255,0.08)` |

### Typographie & Texte
| Token | Rôle | Valeur Light | Valeur Dark |
| :--- | :--- | :--- | :--- |
| `--color-text-strong` | Titres, emphase | `#111827` (Noir doux) | `#e8e4dc` (Blanc cassé) |
| `--color-text` | Corps de texte | `#374151` (Gris foncé) | `#9fa5b4` (Gris bleu) |
| `--color-text-muted` | Légendes, hints | `#6b7280` | `#5a6272` |

### Accents (Gold/Amber)
L'accent est crucial pour l'identité "Genshin".
| Token | Usage | Valeur Light | Valeur Dark |
| :--- | :--- | :--- | :--- |
| `--color-accent` | Boutons, liens, valeurs | `#eab308` (Yellow-500) | `#e8c66a` (Sand Gold) |
| `--color-accent-strong` | Hover, bordures actives | `#ca8a04` (Yellow-600) | `#d4a444` (Deep Gold) |
| `--color-accent-soft` | Backgrounds actifs | `rgba(234,179,8,0.12)` | `rgba(212,164,68,0.12)` |

---

## 2. Responsivité (Mobile First)

L'interface s'adapte aux écrans mobiles (< 768px) avec des ajustements spécifiques.

### Navigation (`Layout.jsx`)
- **Desktop** : Labels texte + Icônes.
- **Mobile** : Icônes uniquement (`hidden sm:block` sur les textes).
- **Padding** : Réduit de `px-6` à `px-4` sur le conteneur principal.

### Cartes Personnages (`genshin-cards.css`)
- **Grid** : 1 colonne (Mobile) → 2 colonnes (Tablet) → 3 colonnes (Desktop).
- **Cartes** : Padding réduit à `1rem` sur mobile (vs `1.5rem`).
- **Avatars** : Taille réduite à `4rem` sur mobile (vs `5rem`).
- **Espacement** : `gap` réduit dans le contenu de la carte.

---

## 3. Composants Clés

### Carte Personnage (`.gi-card`)
- **Structure** : Flex column avec header, stats, et footer.
- **Fond Rareté (Light Mode)** :
  - 5★ : Gradient Or clair (`#fef9c3` → `#fde047`).
  - 4★ : Gradient Violet clair (`#f3e8ff` → `#d8b4fe`).
- **Fond Rareté (Dark Mode)** :
  - 5★/4★ : `var(--color-surface)` avec bordure colorée (Or/Violet).
- **Interactions** : Hover lift (`transform: translateY(-4px)`), ombre renforcée.

### Avatar (`.gi-avatar`)
- **Forme** : Carré arrondi (`border-radius: 14px`).
- **Effets** :
  - **Light Mode** : Ombre douce, pas d'aura blanche.
  - **Dark Mode** : Aura/Bordure colorée, ombre marquée.
- **Masque** : Dégradé de transparence sur le bas/droite pour fondre l'image.

### Slots d'Artéfacts (`.gi-artifact-slot`)
- **État Vide** : Placeholder textuel (2 lettres).
- **État Rempli** : Icône de l'artéfact.
- **État Actif** : `border-color: var(--color-accent-strong)`, background teinté.

---

## 4. Guide d'Implémentation Rapide

### Utiliser le Thème dans Tailwind
Utilisez les variables CSS via la syntaxe arbitraire ou la configuration étendue :

```jsx
// Exemple de bouton thémé
<button className="bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-strong)] ...">
  Action
</button>

// Exemple de surface
<div className="bg-[var(--color-surface)] border border-[var(--color-line)] ...">
  Contenu
</div>
```

### Gestion des Images
Toujours prévoir un fallback pour les images distantes ou générées :

```jsx
<img
  src={imageUrl}
  onError={(e) => { e.currentTarget.src = '/path/to/fallback.png'; }}
  className="object-cover ..."
/>
```

---

## 5. Checklist QA (Recette)

Lors des modifications UI, vérifier :
1. **Light Mode** : Contraste suffisant des textes dorés sur fond blanc ? Fonds de cartes corrects (Clairs) ?
2. **Dark Mode** : Lisibilité sur fond sombre ? Aura des avatars visible ?
3. **Mobile** : La navbar ne déborde pas ? Les cartes ne sont pas trop serrées ?
4. **Data** : Les fallbacks d'images fonctionnent-ils si l'API échoue ?

