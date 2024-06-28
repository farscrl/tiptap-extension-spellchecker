import '../css.css';
import {Editor} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import SpellcheckerExtension from '@farscrl/tiptap-extension-spellchecker';
import {Proofreader, WordList} from './proofreader';


async function loadWordsDictionary(): Promise<WordList> {
  const url = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return await response.json();
}

function initEditor(wordListJson: WordList): void {
  new Editor({
    element: document.getElementById('editor')!,
    extensions: [
      StarterKit,
      SpellcheckerExtension.configure({
        proofreader: new Proofreader(wordListJson),
        uiStrings: {
          noSuggestions: 'No suggestions found',
        },
      }),
    ],
    content: 'This is a demonstration with a misspelled wordd.',
    autofocus: true,
  });
}

loadWordsDictionary().then((wordListJson) => {
  initEditor(wordListJson);
});
