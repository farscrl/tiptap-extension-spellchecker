# Tiptap spellchecker extension

This is an extension to integrate a spellchecker into the [tiptap](https://tiptap.dev/) editor. 

The extension does not implement a spellchecker itself: you have to pass it a proofreader object implementing the `IProofreaderInterface` interface. That proofreader can work locallyin the browser, or it can call an online service, or whatever you want to use as spellchecking service. 


## Usage
Install the dependency

```
npm install @farscrl/tiptap-extension-spellchecker
```

then include the extension to the tiptap editor

```
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

The uiStrings object contains strings used for the minimal UI of the extension. If you don't provide that object, default strings are used. 

# Credits

This extension is inspired by the [tiptap-languagetool](https://github.com/sereneinserenade/tiptap-languagetool) extension. 
