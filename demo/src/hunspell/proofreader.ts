import {IProofreaderInterface, ITextWithPosition} from '@farscrl/tiptap-extension-spellchecker';
import {Hunspell} from 'hunspell-asm';

export interface WordList {
  [word: string]: number;
}

export class Proofreader implements IProofreaderInterface {
  private hunspell: Hunspell;

  constructor(hunspell: Hunspell) {
    this.hunspell = hunspell;
  }

  getSuggestions(word: string): Promise<string[]> {
    return Promise.resolve(this.hunspell!.suggest(word));
  }

  normalizeTextForLanguage(text: string): string {
    return text.toLowerCase();
  }

  proofreadText(sentence: string): Promise<ITextWithPosition[]> {
    const tokens = this.tokenizeString(sentence);
    const errors: ITextWithPosition[] = [];

    tokens.forEach((tkn) => {
      if (!this.hunspell!.spell(tkn.word)) {
        errors.push(tkn);
      }
    });

    return Promise.resolve(errors);
  }

  private tokenizeString(sentence: string): ITextWithPosition[] {
    const tokens: ITextWithPosition[] = [];
    let currentOffset = 0;

    const words = sentence.split(/\W+/);
    for (const word of words) {
      const length = word.length;
      tokens.push({
        offset: currentOffset,
        length,
        word,
      });
      currentOffset += length + 1;
    }

    return tokens;
  }
}
