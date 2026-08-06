# カタカン katacan

Práctica minimalista de escritura japonesa en **hiragana** y **katakana**, inspirada en [flowtype.ai](https://www.flowtype.ai/) pero más personalizable y con más idiomas.

Lees el **significado de la palabra en tu idioma**, y escribes la palabra en kana usando romaji (se convierte automáticamente, como un IME). El kanji se muestra justo debajo. **Nunca se muestra el romaji de la palabra** — la idea es memorizar de verdad.

## Características

- **Sin pistas de romaji**: solo el significado, el kana y el kanji.
- **IME propio**: escribe en romaji y se convierte a kana en tiempo real. Acepta variantes comunes (`shi`/`si`, `chi`/`ti`, `fu`/`hu`, `ja`/`jya`/`zya`…), sokuon (っ), yōon (きゃ) y vocales largas (ー con `-` o vocal doble).
- **6 idiomas** de interfaz y de traducciones: español, English, français, Deutsch, português, italiano.
- **157 palabras** en 11 categorías: animales, comida, naturaleza, cuerpo, familia, tiempo, colores, objetos, lugares, verbos y adjetivos.
- **Ultra personalizable**:
  - Filtro por silabario: hiragana, katakana o ambos
  - Selección de categorías
  - Modo memoria: el kana se oculta y escribes solo a partir del significado (Tab para revelar)
  - Kanji visible u oculto
  - Avance automático (manual / rápido / normal / lento)
  - Tamaño del texto y color de acento
  - Mostrar u ocultar las letras que llevas escritas
- **Estadísticas persistentes**: palabras completadas, precisión y racha (localStorage).
- **Dark mode únicamente**, estilo minimalista.

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `a`–`z`, `-` | Escribir romaji |
| `Espacio` | Saltar palabra (rompe la racha) |
| `Tab` | Revelar kana (en modo memoria) |
| `Esc` | Abrir/cerrar ajustes |

## Uso

Es una web 100 % estática, sin build ni dependencias:

```bash
# cualquier servidor estático sirve
npx serve .
# o simplemente abre index.html en el navegador
```

Deployable directamente en GitHub Pages, Netlify, Vercel, etc.

## Estructura

```
index.html      — página única
style.css       — tema dark minimalista
js/kana.js      — motor romaji → kana (tokenizador + matcher incremental)
js/words.js     — vocabulario con traducciones a 6 idiomas
js/i18n.js      — textos de interfaz en 6 idiomas
js/app.js       — lógica de la app, ajustes y estadísticas
```

## Añadir palabras o idiomas

- **Palabras**: añade una entrada en `js/words.js` con `k` (kana), `j` (kanji o `null`), `c` (categoría) y `t` (traducciones).
- **Idiomas**: añade el código en `js/i18n.js` con todos los textos de interfaz, y la traducción correspondiente en cada palabra de `js/words.js`.
