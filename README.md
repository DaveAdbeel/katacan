# カタカン katacan

Práctica minimalista de escritura japonesa en **hiragana** y **katakana**, inspirada en [flowtype.ai](https://www.flowtype.ai/) pero más personalizable y con más idiomas.

**En vivo: https://daveadbeel.github.io/katacan/**

Lees el **significado de la palabra en tu idioma**, y escribes la palabra en kana usando romaji (se convierte automáticamente, como un IME). El kanji se muestra justo debajo, y el romaji que vas tecleando queda visible hasta la siguiente palabra. **Nunca se muestra el romaji de la palabra como pista** — la idea es memorizar de verdad.

## Características

- **Sin pistas de romaji**: solo el significado, el kana y el kanji.
- **IME propio, sin bloquear la escritura**: escribe en romaji y se convierte a kana en tiempo real (variantes comunes `shi`/`si`, `chi`/`ti`, `fu`/`hu`, `ja`/`jya`/`zya`…, sokuon っ, yōon きゃ, vocales largas ー). Si te equivocas, la tecla **no se rechaza**: el kana en curso y el romaji tecleado se ponen en rojo para que veas el error, y corriges con `Backspace` como en cualquier campo de texto — nunca te quedas bloqueado.
- **Rastro de romaji**: lo que tecleas se acumula bajo la palabra (aciertos y errores) y no se borra hasta la siguiente palabra.
- **6 idiomas** de interfaz y de traducciones: español, English, français, Deutsch, português, italiano.
- **Vocabulario JLPT completo N5–N1**: 8.087 palabras (N5 717 · N4 666 · N3 2.126 · N2 1.890 · N1 2.688) del dataset abierto [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks) (MIT), con significados en inglés y en **español al 98%** (7.963/8.087, vía [jmdict-simplified](https://github.com/scriptin/jmdict-simplified) / JMdict-EDRDG). El resto recae automáticamente en inglés. Cada nivel se carga bajo demanda.
- **Set básico curado**: 157 palabras en 11 categorías con traducciones a los 6 idiomas.
- **Colección**: una ficha por cada palabra del nivel/categorías activos. Las que ya escribiste bien alguna vez brillan con el color de acento; las demás quedan sin contraste. Al tocar una ficha dominada se abre su detalle: significado, cada kanji con sus lecturas on'yomi/kun'yomi y significado (vía KANJIDIC2), y otras palabras del mismo pool que comparten ese kanji.
- **Versión móvil**: toca la pantalla para invocar el teclado y escribe igual que en escritorio (incluido backspace); botones táctiles para saltar/revelar.
- **Ultra personalizable**: nivel (Básico/N5–N1), silabario, categorías, modo memoria (kana oculto), kanji on/off, avance automático, tamaño de texto, color de acento, rastro de romaji on/off.
- **Estadísticas y progreso persistentes**: palabras completadas, precisión, racha y palabras dominadas (localStorage).
- **Dark mode únicamente**, estilo minimalista.

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `a`–`z`, `-` | Escribir romaji |
| `Backspace` | Corregir lo último tecleado |
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
    kana/                #   motor romaji → kana: tokenizer + evaluateTyping (recalcula
                         #   desde el string tecleado completo; sin rechazo, con backspace)
    words/               #   set básico tipado (6 idiomas) + JLPT N5–N1 (chunks lazy)
    kanji/               #   diccionario KANJIDIC2 recortado (chunk lazy)
    i18n/                #   diccionarios de interfaz y detección de idioma
  features/
    practice/            # useWordPool (fuente compartida), useTypingGame,
                         #   WordDisplay, RomajiTrace, PracticeStage
    collection/          # CollectionView (grid), WordCard, WordDetailPanel
    settings/            # SettingsContext (persistido), SettingsPanel
    stats/                # StatsContext (persistido), StatsBar
    mastery/              # MasteryContext (persistido): qué palabras ya escribiste bien
  shared/
    components/          # Toggle, Segmented, Chip
    hooks/               # useLocalStorage
```

Reglas de dependencia: `features` puede importar de `core` y `shared`; `core` no importa de nadie. El estado global (ajustes, estadísticas y progreso) vive en contextos de React persistidos en localStorage. `useWordPool` centraliza la carga/filtrado de palabras para que la práctica y la colección lean siempre el mismo pool.

### Motor de escritura (`core/kana/typing.ts`)

`evaluateTyping(units, typed)` es una función pura: dado el romaji tecleado hasta ahora (tal cual, con errores incluidos), recalcula desde cero cuántas unidades kana están correctamente completadas y si la cola en curso todavía puede llegar a encajar. No hay estado mutable ni teclas rechazadas — la interfaz solo colorea en rojo la parte que ya no encaja, y borrar (`Backspace`) es simplemente recalcular con un carácter menos.

## Despliegue

Cada push a `main` ejecuta el workflow de GitHub Actions: tests → build → publica `dist/` en la rama `gh-pages`, que sirve el sitio en GitHub Pages.

## Añadir palabras o idiomas

- **Palabras básicas**: añade una entrada en `src/core/words/data.ts` (`kana`, `kanji`, `category`, `translations`).
- **JLPT**: los JSON de `src/core/words/jlpt/` se regeneran con `scripts/build-jlpt.ts` a partir de los CSV de open-anki-jlpt-decks, y luego se enriquecen con español ejecutando `scripts/enrich-spanish.ts <ruta-a-jmdict-spa.json>` (el JSON en español de jmdict-simplified, publicado en sus [releases](https://github.com/scriptin/jmdict-simplified/releases/latest)).
- **Kanji**: `src/core/kanji/data.json` se regenera con `scripts/build-kanji.ts <ruta-a-kanjidic2-all.json>` (el JSON "all" de kanjidic2 en los releases de jmdict-simplified) — recorre todo el vocabulario y guarda solo los kanji que realmente se usan.
- **Idiomas**: añade el código en `src/core/i18n/types.ts` (`LANGUAGES`), el diccionario en `dictionaries.ts` y la traducción en cada palabra de `data.ts` — TypeScript te marcará todo lo que falte.

## Créditos de datos

- Vocabulario JLPT: [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks) (MIT), basado en las listas de Jonathan Waller.
- Traducciones al español y diccionario de kanji: [jmdict-simplified](https://github.com/scriptin/jmdict-simplified), derivado de [JMdict/KANJIDIC2](https://www.edrdg.org/) (EDRDG license) y licenciado como CC-BY-SA 4.0.
