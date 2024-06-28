import {IProofreaderInterface, ITextWithPosition} from '@farscrl/tiptap-extension-spellchecker';

export interface WordList {
  [word: string]: number;
}

export class Proofreader implements IProofreaderInterface {
  private wordList: WordList;

  constructor(wordListJson: WordList) {
    this.wordList = wordListJson;
  }

  async proofreadText(sentence: string): Promise<ITextWithPosition[]> {
    const wordsWithPosition: ITextWithPosition[] = [];
    let currentOffset = 0;

    const words = sentence.split(/\W+/);
    for (const word of words) {
      const lowerWord = word.toLowerCase().trim();
      const length = word.length;
      if (!this.wordList[lowerWord] && lowerWord !== '') {
        wordsWithPosition.push({
          offset: currentOffset,
          length,
          word,
        });
      }
      currentOffset += length + 1; // +1 for the space after each word
    }

    return wordsWithPosition;
  }

  async getSuggestions(word: string): Promise<string[]> {
    // Example: just return similar words by replacing one character
    const suggestions: string[] = [];
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';

    for (let i = 0; i < word.length; i++) {
      for (const char of alphabet) {
        const newWord = word.slice(0, i) + char + word.slice(i + 1);
        if (this.wordList[newWord]) {
          suggestions.push(newWord);
        }
      }
    }

    return suggestions;
  }

  normalizeTextForLanguage(text: string): string {
    // You can implement language-specific text normalization here
    // For simplicity, let's just convert to lowercase
    return text.toLowerCase();
  }
}
