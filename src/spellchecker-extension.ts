import { Extension } from '@tiptap/core';
import { Node } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { DecorationSet } from 'prosemirror-view';
import { IProofreaderInterface } from './i-proofreader-interface';
import Spellchecker from './spellchecker';

// transactions caused by the spellchecker are marked with this metadata
export const SPELLCHECKER_TRANSACTION = 'spellchecker-transation';
export const LOADING_TRANSACTION = 'loading';

export interface IUiStrings {
  noSuggestions?: string;
}

export interface ISpellcheckerOptions {
  proofreader?: IProofreaderInterface,
  uiStrings?: IUiStrings;
}

interface ISpellcheckerStorage {
  didPaste: boolean;
  spellchecker?: Spellchecker;
}

// typescript definition of commands
declare module '@tiptap/core' {
  // tslint:disable-next-line:interface-name
  interface Commands<ReturnType> {
    spellchecker: {
      checkSpelling: () => ReturnType
    }
  }
}

export const SpellcheckerExtension = Extension.create<ISpellcheckerOptions, ISpellcheckerStorage>({
  name: 'spellchecker',

  addOptions() {
    return {
      proofreader: undefined,
      uiStrings: {
        noSuggestions: ''
      }
    };
  },

  addStorage() {
    return {
      didPaste: false,
      spellchecker: undefined,
    };
  },

  addCommands() {
    return {
      checkSpelling: () => ({ tr }) => {
        this.storage.spellchecker!.proofreadDoc(tr.doc);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    return [
      new Plugin({
        key: new PluginKey('spellcheckerPlugin'),
        props: {
          decorations(state) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return this.getState(state);
          },
          handlePaste(view) {
            that.storage.didPaste = true;
          },
          handleClick() {
            const spellchecker = that.storage.spellchecker! as Spellchecker;
            spellchecker.hideSuggestionBox();
          }
        },
        state: {
          init(config, instance) {
            const spellchecker = new Spellchecker(that.options.proofreader!, that.options.uiStrings);
            that.storage.spellchecker = spellchecker;
            spellchecker.setDecorationSet(DecorationSet.create(instance.doc, []));

            spellchecker.proofreadDoc(instance.doc);

            return spellchecker.getDecorationSet();
          },
          apply(transaction, value, oldState, newState) {
            const spellchecker = that.storage.spellchecker! as Spellchecker;
            if (transaction.getMeta(SPELLCHECKER_TRANSACTION)) {
              return spellchecker.getDecorationSet();
            }

            if (transaction.docChanged) {
              if (that.storage.didPaste) {
                that.storage.didPaste = false;
                spellchecker.debouncedProofreadDoc(transaction.doc);
              } else if (!spellchecker.completeProofreadingDone) {
                spellchecker.debouncedProofreadDoc(transaction.doc);
              } else {
                const {
                  selection: { from, to },
                } = transaction;

                let changedNodeWithPos: { node: Node; pos: number };

                transaction.doc.descendants((node, pos) => {
                  if (!node.isBlock) {
                    return false;
                  }

                  const [nodeFrom, nodeTo] = [pos, pos + node.nodeSize];
                  if (!(nodeFrom <= from && to <= nodeTo)) {
                    return;
                  }

                  changedNodeWithPos = { node, pos };
                });

                if (changedNodeWithPos!) {
                  spellchecker.onNodeChanged(
                    changedNodeWithPos.node,
                    changedNodeWithPos.node.textContent,
                    changedNodeWithPos.pos + 1,
                  );
                }
              }              
            }

            spellchecker.setDecorationSet(spellchecker.getDecorationSet().map(transaction.mapping, transaction.doc));
            setTimeout(spellchecker.addEventListenersToDecorations, 100);
            return spellchecker.getDecorationSet();
          }
        },
        view: () => ({
          update: (view) => {
            const spellchecker = that.storage.spellchecker!;
            spellchecker.setEditorView(view);

            view?.dom?.parentNode?.appendChild(spellchecker.getSuggestionBox());

            setTimeout(spellchecker.addEventListenersToDecorations, 100);
          },
        }),
      }),
    ];
  }
});
