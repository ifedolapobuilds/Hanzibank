/**
 * Pinyin Tone Map and Conversion Helpers
 */
const TONE_MAP: Record<string, string[]> = {
  a: ["ā", "á", "ǎ", "à", "a"],
  e: ["ē", "é", "ě", "è", "e"],
  i: ["ī", "í", "ǐ", "ì", "i"],
  o: ["ō", "ó", "ǒ", "ò", "o"],
  u: ["ū", "ú", "ǔ", "ù", "u"],
  v: ["ǖ", "ǘ", "ǚ", "ǜ", "ü"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ", "ü"],
};

/**
 * Converts numbered pinyin string (e.g. "ni3 hao3") to diacritic pinyin ("nǐ hǎo").
 * If already in diacritic form, returns as is.
 */
export function convertNumberedToDiacriticPinyin(input: string): string {
  if (!input) return "";

  // Split by words/syllables
  return input
    .trim()
    .split(/\s+/)
    .map((syllable) => {
      const match = syllable.match(/^([a-zA-ZüÜvV]+)([1-5]?)$/);
      if (!match) return syllable;

      const [, letters, toneStr] = match;
      const tone = toneStr ? parseInt(toneStr, 10) : 5;
      if (tone < 1 || tone > 5) return letters;

      let result = letters.toLowerCase();

      // Tone mark placement rules:
      // 1. 'a' or 'e' always gets the tone mark
      // 2. 'ou' gets mark on 'o'
      // 3. Otherwise the last vowel gets the mark
      if (result.includes("a")) {
        result = result.replace("a", TONE_MAP["a"][tone - 1]);
      } else if (result.includes("e")) {
        result = result.replace("e", TONE_MAP["e"][tone - 1]);
      } else if (result.includes("ou")) {
        result = result.replace("o", TONE_MAP["o"][tone - 1]);
      } else {
        const vowels = ["a", "e", "i", "o", "u", "v", "ü"];
        for (let i = result.length - 1; i >= 0; i--) {
          const char = result[i];
          if (vowels.includes(char)) {
            const mapped = TONE_MAP[char]?.[tone - 1];
            if (mapped) {
              result = result.substring(0, i) + mapped + result.substring(i + 1);
              break;
            }
          }
        }
      }

      return result;
    })
    .join(" ");
}

/**
 * Validates if the string has Chinese characters
 */
export function isChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

/**
 * Derives the exact Chinese character count accurately
 */
export function getCharacterCount(characterStr: string): number {
  if (!characterStr) return 0;
  // Match only actual Hanzi characters (ignoring english/punctuation/spaces)
  const matches = characterStr.match(/[\u4e00-\u9fa5]/g);
  return matches ? matches.length : Array.from(characterStr.trim()).length;
}
