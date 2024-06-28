import '../css.css';
import { Hunspell, HunspellFactory, loadModule } from 'hunspell-asm';
import {Editor} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import SpellcheckerExtension from '@farscrl/tiptap-extension-spellchecker';
import {Proofreader} from './proofreader';

let hunspellFactory: HunspellFactory;
let affFile: string;
let dictFile: string;
let hunspell: Hunspell;

async function loadDictionary() {
  hunspellFactory = await loadModule();

  const aff = await fetch('https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en-GB/index.aff');
  const affBuffer = new Uint8Array(await aff.arrayBuffer());
  affFile = hunspellFactory.mountBuffer(affBuffer, 'en.aff');

  const dic = await fetch('https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/en-GB/index.dic');
  const dicBuffer = new Uint8Array(await dic.arrayBuffer());
  dictFile = hunspellFactory.mountBuffer(dicBuffer, 'en.dic');

  hunspell = hunspellFactory.create(affFile, dictFile);
}

function initEditor(): void {
  new Editor({
    element: document.getElementById('editor')!,
    extensions: [
      StarterKit,
      SpellcheckerExtension.configure({
        proofreader: new Proofreader(hunspell),
        uiStrings: {
          noSuggestions: 'No suggestions found',
        },
      }),
    ],
    content: 'This is a demonstration with a misspelled wordd.',
    autofocus: true,
  });
}

loadDictionary().then(() => {
  initEditor();
});
