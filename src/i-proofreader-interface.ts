export interface ITextWithPosition {
    offset: number
    length: number
    word: string;
}

export interface IProofreaderInterface {
    proofreadText(sentence: string): Promise<ITextWithPosition[]>;
    getSuggestions(word: string): Promise<string[]>;
    normalizeTextForLanguage(text: string): string;
}
