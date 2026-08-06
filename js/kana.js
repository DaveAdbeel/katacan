/* ============================================================
 * kana.js — motor romaji → kana (IME interno de katacan)
 *
 * Convierte la entrada del usuario (romaji) en unidades kana y
 * la valida contra la palabra objetivo, sin mostrar nunca el
 * romaji de la palabra. Soporta hiragana, katakana, yōon (きゃ),
 * sokuon (っ/ッ), chōon (ー) y las variantes de escritura más
 * comunes (shi/si, chi/ti, fu/hu, ja/jya/zya, etc.).
 * ============================================================ */

const Kana = (() => {
  // Tabla base: unidad hiragana → grafías romaji aceptadas
  const BASE = {
    'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
    'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'さ': ['sa'], 'し': ['shi', 'si'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
    'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
    'だ': ['da'], 'ぢ': ['di', 'ji'], 'づ': ['du', 'zu'], 'で': ['de'], 'ど': ['do'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'を': ['wo', 'o'],
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
    'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'],
    'じゃ': ['ja', 'jya', 'zya'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じょ': ['jo', 'jyo', 'zyo'],
    'ちゃ': ['cha', 'tya'], 'ちゅ': ['chu', 'tyu'], 'ちょ': ['cho', 'tyo'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
    // Combinaciones extendidas (préstamos en katakana)
    'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'],
    'うぃ': ['wi'], 'うぇ': ['we'], 'うぉ': ['who'],
    'てぃ': ['thi', 'texi'], 'でぃ': ['dhi', 'dexi'],
    'しぇ': ['she'], 'じぇ': ['je'], 'ちぇ': ['che'],
    'ヴ': ['vu'],
  };

  const SMALL = 'ゃゅょぁぃぅぇぉャュョァィゥェォ';
  const VOWELS = 'aeiou';

  // Katakana (ァ..ヶ) → hiragana equivalente para buscar en BASE
  function toHiragana(str) {
    let out = '';
    for (const ch of str) {
      const code = ch.codePointAt(0);
      out += (code >= 0x30A1 && code <= 0x30F6) ? String.fromCodePoint(code - 0x60) : ch;
    }
    return out;
  }

  function isKatakanaChar(ch) {
    const code = ch.codePointAt(0);
    return (code >= 0x30A0 && code <= 0x30FF);
  }

  /**
   * Divide una palabra kana en unidades de escritura, cada una con
   * la lista de grafías romaji aceptadas.
   */
  function tokenize(word) {
    const chars = [...word];
    const units = [];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === 'っ' || ch === 'ッ') {
        units.push({ text: ch, type: 'sokuon', romaji: [] });
      } else if (ch === 'ー') {
        units.push({ text: ch, type: 'choon', romaji: [] });
      } else if (ch === 'ん' || ch === 'ン') {
        units.push({ text: ch, type: 'n', romaji: [] });
      } else if (i + 1 < chars.length && SMALL.includes(chars[i + 1])) {
        units.push({ text: ch + chars[i + 1], type: 'normal', romaji: [] });
        i++;
      } else {
        units.push({ text: ch, type: 'normal', romaji: [] });
      }
    }

    // Resolver romaji (algunas unidades dependen de la vecina)
    units.forEach((u, idx) => {
      if (u.type === 'normal') {
        u.romaji = BASE[toHiragana(u.text)] || [];
      }
    });
    units.forEach((u, idx) => {
      const next = units[idx + 1];
      const prev = units[idx - 1];
      if (u.type === 'sokuon') {
        // Consonante inicial duplicada de la siguiente unidad (ッコ → "k")
        const firsts = new Set();
        if (next) {
          for (const r of (next.romaji.length ? next.romaji : resolveAhead(units, idx + 1))) {
            const c = r[0];
            if (c && !VOWELS.includes(c) && c !== 'n') firsts.add(c);
          }
        }
        u.romaji = [...firsts, 'ltu', 'xtu', 'ltsu'];
      } else if (u.type === 'choon') {
        // Guion o repetición de la vocal anterior (コーヒー → "-" / "o")
        const set = new Set(['-']);
        if (prev) {
          for (const r of prev.romaji) {
            const v = r[r.length - 1];
            if (VOWELS.includes(v)) set.add(v);
          }
        }
        u.romaji = [...set];
      } else if (u.type === 'n') {
        // "nn" siempre; "n" solo si no crea ambigüedad con la unidad siguiente
        const ambiguous = next && next.romaji.some(r => VOWELS.includes(r[0]) || r[0] === 'y' || r[0] === 'n');
        u.romaji = ambiguous ? ['nn'] : ['n', 'nn'];
      }
    });
    return units;
  }

  // Para sokuon seguido de unidad aún sin resolver (no ocurre con la
  // pasada en orden, pero se mantiene por seguridad)
  function resolveAhead(units, idx) {
    const u = units[idx];
    if (!u) return [];
    if (u.type === 'normal') return BASE[toHiragana(u.text)] || [];
    return [];
  }

  /**
   * Matcher incremental: alimenta letra a letra la entrada del usuario
   * y avanza por las unidades kana de la palabra objetivo.
   *
   * input() devuelve: 'progress' | 'unit' | 'complete' | 'error'
   */
  class Matcher {
    constructor(word) {
      this.units = tokenize(word);
      this.index = 0;
      this.buffer = '';
      this.pendingMatch = null; // buffer ya válido, esperando desambiguar (n/nn)
    }

    get done() { return this.index >= this.units.length; }
    get current() { return this.units[this.index]; }

    input(ch) {
      if (this.done) return 'complete';
      ch = ch.toLowerCase();
      const unit = this.current;
      const candidate = this.buffer + ch;
      const exact = unit.romaji.includes(candidate);
      const prefix = unit.romaji.some(r => r.length > candidate.length && r.startsWith(candidate));

      if (exact && prefix) {
        // En la última unidad no hay nada que desambiguar: completa ya
        // (p. ej. ほん ← "hon" no debe esperar una segunda "n")
        if (this.index === this.units.length - 1) return this._advance();
        this.buffer = candidate;
        this.pendingMatch = candidate;
        return 'progress';
      }
      if (exact) {
        return this._advance();
      }
      if (prefix) {
        this.buffer = candidate;
        return 'progress';
      }
      // Sin coincidencia: si había un match pendiente, ciérralo y
      // reintenta esta letra contra la siguiente unidad
      if (this.pendingMatch) {
        const res = this._advance();
        if (res === 'complete') return 'complete';
        return this.input(ch);
      }
      return 'error';
    }

    _advance() {
      this.buffer = '';
      this.pendingMatch = null;
      this.index++;
      return this.done ? 'complete' : 'unit';
    }

    /** Fuerza el cierre de un match pendiente (p. ej. al validar la palabra) */
    flush() {
      if (this.pendingMatch) this._advance();
      return this.done;
    }
  }

  return { tokenize, Matcher, isKatakanaChar, toHiragana };
})();

if (typeof module !== 'undefined') module.exports = Kana;
