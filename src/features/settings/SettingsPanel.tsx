import { DICTIONARIES, LANGUAGES, type LanguageCode } from '../../core/i18n'
import { CATEGORIES } from '../../core/words'
import { Chip } from '../../shared/components/Chip'
import { Segmented } from '../../shared/components/Segmented'
import { Toggle } from '../../shared/components/Toggle'
import { useStats } from '../stats/StatsContext'
import { ACCENTS } from './constants'
import { useSettings } from './SettingsContext'

function Section({ title }: { title: string }) {
  return (
    <h3 className="mt-6 mb-2 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-faint">
      {title}
    </h3>
  )
}

interface Props {
  open: boolean
  onClose: () => void
}

/** Panel lateral con toda la configuración de la app. */
export function SettingsPanel({ open, onClose }: Props) {
  const { settings, update, t } = useSettings()
  const { reset } = useStats()

  const toggleCategory = (c: (typeof CATEGORIES)[number]) => {
    update({
      categories: settings.categories.includes(c)
        ? settings.categories.filter((x) => x !== c)
        : [...settings.categories, c],
    })
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-10 bg-black/45 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-20 flex w-[min(340px,92vw)] flex-col border-l border-line bg-raised transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-jp text-base font-normal text-dim">設定</h2>
          <button
            type="button"
            aria-label="close"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-dim transition-colors hover:bg-hover hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          <Section title={t.language} />
          <select
            value={settings.lang}
            onChange={(e) => update({ lang: e.target.value as LanguageCode })}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-(--accent)"
          >
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {DICTIONARIES[code]._name}
              </option>
            ))}
          </select>

          <Section title={t.script} />
          <Segmented
            options={[
              ['both', t.scriptBoth],
              ['hiragana', t.scriptHiragana],
              ['katakana', t.scriptKatakana],
            ]}
            value={settings.script}
            onChange={(script) => update({ script })}
          />

          <Section title={t.categories} />
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={settings.categories.length === CATEGORIES.length}
              onClick={() => update({ categories: [...CATEGORIES] })}
            >
              {t.selectAll}
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={settings.categories.includes(c)}
                onClick={() => toggleCategory(c)}
              >
                {t[`categories_${c}`]}
              </Chip>
            ))}
          </div>

          <Section title={t.settings} />
          <Toggle
            label={t.showKanji}
            checked={settings.showKanji}
            onChange={(showKanji) => update({ showKanji })}
          />
          <Toggle
            label={t.recallMode}
            checked={settings.recallMode}
            onChange={(recallMode) => update({ recallMode })}
          />
          <Toggle
            label={t.showRomajiTrace}
            checked={settings.showRomajiTrace}
            onChange={(showRomajiTrace) => update({ showRomajiTrace })}
          />

          <Section title={t.autoAdvance} />
          <Segmented
            options={[
              ['off', t.aaOff],
              ['fast', t.aaFast],
              ['normal', t.aaNormal],
              ['slow', t.aaSlow],
            ]}
            value={settings.autoAdvance}
            onChange={(autoAdvance) => update({ autoAdvance })}
          />

          <Section title={t.fontSize} />
          <Segmented
            options={[
              ['s', t.sizeS],
              ['m', t.sizeM],
              ['l', t.sizeL],
            ]}
            value={settings.fontScale}
            onChange={(fontScale) => update({ fontScale })}
          />

          <Section title={t.accent} />
          <div className="flex gap-2">
            {ACCENTS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                onClick={() => update({ accent: color })}
                style={{ background: color }}
                className={`size-[26px] cursor-pointer rounded-full border-2 transition-transform hover:scale-110 ${
                  color === settings.accent ? 'border-ink' : 'border-transparent'
                }`}
              />
            ))}
          </div>

          <Section title={t.stats} />
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer rounded-lg border border-line px-3.5 py-2 text-[0.78rem] text-danger transition-colors hover:border-danger"
          >
            {t.resetStats}
          </button>
        </div>
      </aside>
    </>
  )
}
