# カタカン katacan

Práctica minimalista de escritura japonesa en **hiragana** y **katakana**, inspirada en [flowtype.ai](https://www.flowtype.ai/) pero más personalizable y con más idiomas.

**En vivo: https://daveadbeel.github.io/katacan/**

Lees el **significado de la palabra en tu idioma**, y escribes la palabra en kana usando romaji (se convierte automáticamente, como un IME). El kanji se muestra justo debajo, y el romaji que vas tecleando queda visible hasta la siguiente palabra. **Nunca se muestra el romaji de la palabra como pista** — la idea es memorizar de verdad.

## Características

- **Sin pistas de romaji**: solo el significado, el kana y el kanji.
- **IME propio**: escribe en romaji y se convierte a kana en tiempo real. Acepta variantes comunes (`shi`/`si`, `chi`/`ti`, `fu`/`hu`, `ja`/`jya`/`zya`…), sokuon (っ), yōon (きゃ) y vocales largas (ー con `-` o vocal doble).
- **Rastro de romaji**: lo que tecleas se acumula bajo la palabra y no se borra hasta la siguiente.
- **6 idiomas** de interfaz y de traducciones: español, English, français, Deutsch, português, italiano.
- **Vocabulario JLPT completo N5–N1**: 8.087 palabras (N5 717 · N4 666 · N3 2.126 · N2 1.890 · N1 2.688) del dataset abierto [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks) (MIT), con significados en inglés. Cada nivel se carga bajo demanda.
- **Set básico curado**: 157 palabras en 11 categorías con traducciones a los 6 idiomas.
- **Versión móvil**: toca la pantalla para invocar el teclado y escribe igual que en escritorio; botones táctiles para saltar/revelar.
- **Ultra personalizable**: nivel (Básico/N5–N1), silabario, categorías, modo memoria (kana oculto), kanji on/off, avance automático, tamaño de texto, color de acento, rastro de romaji on/off.
- **Estadísticas persistentes**: palabras completadas, precisión y racha (localStorage).
- **Dark mode únicamente**, estilo minimalista.

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `a`–`z`, `-` | Escribir romaji |
| `Espacio` | Saltar palabra (rompe la racha) |
| `Tab` | Revelar kana (en modo memoria) |
| `Esc` | Abrir/cerrar ajustes |

## Stack

React 19 · TypeScript · Tailwind CSS 4 · Vite 8 · Vitest

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # tests del motor de kana (vitest)
npm run build    # typecheck + build de producción en dist/
npm run preview  # sirve el build localmente
```

## Arquitectura

Organización *feature-based*: un núcleo puro sin React y las funcionalidades agrupadas por dominio, cada una con sus componentes, hooks y tipos.

```
src/
  core/                  # lógica pura, sin React (testeable de forma aislada)
    kana/                #   motor romaji → kana: tokenizer + matcher incremental
    words/               #   set básico tipado (6 idiomas) + JLPT N5–N1 (chunks lazy)
    i18n/                #   diccionarios de interfaz y detección de idioma
  features/
    practice/            # sesión de práctica: useTypingGame, WordDisplay,
                         #   RomajiTrace, PracticeStage
    settings/            # SettingsContext (persistido), SettingsPanel
    stats/               # StatsContext (persistido), StatsBar
  shared/
    components/          # Toggle, Segmented, Chip
    hooks/               # useLocalStorage
```

Reglas de dependencia: `features` puede importar de `core` y `shared`; `core` no importa de nadie. El estado global (ajustes y estadísticas) vive en contextos de React persistidos en localStorage.

## Despliegue

Cada push a `main` ejecuta el workflow de GitHub Actions: tests → build → publica `dist/` en la rama `gh-pages`, que sirve el sitio en GitHub Pages.

## Añadir palabras o idiomas

- **Palabras básicas**: añade una entrada en `src/core/words/data.ts` (`kana`, `kanji`, `category`, `translations`).
- **JLPT**: los JSON de `src/core/words/jlpt/` se regeneran con `scripts/build-jlpt.ts` a partir de los CSV de open-anki-jlpt-decks.
- **Idiomas**: añade el código en `src/core/i18n/types.ts` (`LANGUAGES`), el diccionario en `dictionaries.ts` y la traducción en cada palabra de `data.ts` — TypeScript te marcará todo lo que falte.
