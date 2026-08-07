export const LANGUAGES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const

export type LanguageCode = (typeof LANGUAGES)[number]

export interface UiStrings {
  _name: string
  tabPractice: string
  tabCollection: string
  masteredLabel: string
  kanjiLabel: string
  onyomiLabel: string
  onyomiHint: string
  kunyomiLabel: string
  kunyomiHint: string
  kanjiNotationHint: string
  usedInLabel: string
  level: string
  levelBasic: string
  jlptNote: string
  skip: string
  reveal: string
  tagline: string
  hint: string
  keySkip: string
  keyReveal: string
  keySettings: string
  settings: string
  language: string
  script: string
  scriptBoth: string
  scriptHiragana: string
  scriptKatakana: string
  categories: string
  selectAll: string
  showKanji: string
  recallMode: string
  autoAdvance: string
  aaOff: string
  aaFast: string
  aaNormal: string
  aaSlow: string
  fontSize: string
  sizeS: string
  sizeM: string
  sizeL: string
  accent: string
  showRomajiTrace: string
  stats: string
  statsWords: string
  statsAccuracy: string
  statsStreak: string
  resetStats: string
  emptyPool: string
  pressAnyKey: string
  categories_animals: string
  categories_food: string
  categories_nature: string
  categories_body: string
  categories_family: string
  categories_time: string
  categories_colors: string
  categories_objects: string
  categories_places: string
  categories_verbs: string
  categories_adjectives: string
}
