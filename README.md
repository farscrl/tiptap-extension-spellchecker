# Tiptap Spellchecker Extension

This is an extension to integrate a spellchecker into the [tiptap](https://tiptap.dev/) editor.

The extension does not implement a spellchecker itself: you have to pass it a proofreader object implementing the `IProofreaderInterface` interface. That proofreader can work locally in the browser, or it can call an online service, or whatever you want to use as spellchecking service.

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

### Configuration Options

- **proofreader** (required): An object implementing the `IProofreaderInterface` interface
- **uiStrings** (optional): Strings used for the minimal UI of the extension. If not provided, default strings are used.

## Demo

A demo implementation is available in the `demo` folder. To run the demo:

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

## Credits

This extension is inspired by the [tiptap-languagetool](https://github.com/sereneinserenade/tiptap-languagetool) extension.

## License

MIT 
