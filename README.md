# Tiptap Spellchecker Extension

This is an extension to integrate a spellchecker into the [tiptap](https://tiptap.dev/) editor.

The extension does not implement a spellchecker itself: you have to pass it a proofreader object implementing the `IProofreaderInterface` interface. That proofreader can work locally in the browser, or it can call an online service, or whatever you want to use as spellchecking service.

Requires `@tiptap/core` `^3.0.1` (peer dependency) to already be installed in your project.

## Installation

Install the dependency using npm:

```bash
npm install @farscrl/tiptap-extension-spellchecker
```

Or using pnpm:

```bash
pnpm add @farscrl/tiptap-extension-spellchecker
```

## Usage

Include the extension in your tiptap editor configuration:

```typescript
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import SpellcheckerExtension, { IProofreaderInterface, ITextWithPosition } from '@farscrl/tiptap-extension-spellchecker';

const myProofreader = new Proofreader(); // implementing IProofreaderInterface

new Editor({
    extensions: [
        StarterKit,
        SpellcheckerExtension.configure({
            proofreader: myProofreader,
            uiStrings: {
                noSuggestions: 'No suggestions found'
            }
        })
    ],
});
```

Implement `IProofreaderInterface` to plug in your own spellchecking logic:

```typescript
interface ITextWithPosition {
    offset: number;
    length: number;
    word: string;
}

interface IProofreaderInterface {
    // find misspelled words in a sentence
    proofreadText(sentence: string): Promise<ITextWithPosition[]>;
    // return suggestions for a misspelled word
    getSuggestions(word: string): Promise<string[]>;
    // normalize text (e.g. strip accents/casing) before it's checked
    normalizeTextForLanguage(text: string): string;
}
```

### Configuration Options

- **proofreader** (required): An object implementing the `IProofreaderInterface` interface
- **uiStrings** (optional): Strings used for the minimal UI of the extension. If not provided, default strings are used.
- **onShowSuggestionsEvent** (optional): `(word: string) => void` callback fired whenever the suggestion box is shown for a misspelled word

### Commands

The extension registers these editor commands:

- **checkSpelling()**: Re-runs the spellchecker on the whole document
- **selectAll()**: Selects the entire document content
- **copy()**: Copies the current selection to the clipboard

```typescript
editor.commands.checkSpelling();
```

### Styling

The extension does not ship any CSS. Misspelled words are marked with a `spell-error` class, and the suggestion dropdown is rendered as a `#suggestions-box` element containing a `ul.suggestion-list` — you need to add your own styles for both, otherwise the extension has no visible effect. A minimal starting point:

```css
.spell-error {
    text-decoration: underline wavy red;
}

#suggestions-box {
    position: absolute;
    border: 1px solid black;
    background-color: #f7f7f7;
    border-radius: 4px;
}

#suggestions-box ul {
    padding: 2px 4px;
    margin: 0;
    display: inline-block;
}

#suggestions-box li {
    cursor: pointer;
    list-style: none;
}
```

See `demo/src/css.css` for a more complete example.

## Demo

Two demo implementations are available in the `demo` folder: one using a local, in-browser dictionary (`local`), and one calling out to a Hunspell-based checker (`hunspell`). To run them:

```bash
# Clone the repository
git clone https://github.com/farscrl/tiptap-extension-spellchecker.git
cd tiptap-extension-spellchecker

# Install dependencies
pnpm install

# Build the extension
pnpm run build

# Run the demo
cd demo
pnpm install
pnpm start
```

The demo will open in your browser showing the spellchecker in action.

## Development

### Building

Build the TypeScript source:

```bash
pnpm run build
```

### Testing

Run the test suite:

```bash
pnpm run test
```

### Linting

Check code quality:

```bash
pnpm run lint
```

## Publishing

To release a new version:

1. Bump `version` in `package.json`.
2. Add a dated entry for the new version to `CHANGELOG.md`.
3. Commit both files as `chore: prepare version X.Y.Z`.
4. Tag that commit: `git tag vX.Y.Z` and push it: `git push --tags`.
5. Run `npm publish` (the `prepare` script builds `lib/` automatically before publishing).

## Credits

This extension is inspired by the [tiptap-languagetool](https://github.com/sereneinserenade/tiptap-languagetool) extension.

## License

MIT 
