import { Node } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { IProofreaderInterface } from './i-proofreader-interface';
import { IUiStrings, LOADING_TRANSACTION, SPELLCHECKER_TRANSACTION } from './spellchecker-extension';
import { debounce } from './util';

interface ITextNodesWithPosition {
  text: string
  from: number
  to: number
}

export default class Spellchecker {

  get completeProofreadingDone(): boolean {
    return this.isInitialProofreadingDone;
  }
  public debouncedProofreadDoc = debounce(this.proofreadDoc.bind(this), 500);
  public debouncedGetMatchAndSetDecorations = debounce(this.getMatchAndSetDecorations.bind(this), 300);
  public debouncedClickEventsListener = debounce(this.clickEventsListener.bind(this), 0);
  public debouncedAcceptSuggestionEventsListener = debounce(this.acceptSuggestionListener.bind(this), 0);

  private proofreader: IProofreaderInterface;
  private uiStrings?: IUiStrings;
  private showSuggestionsEvent?: (word: string) => void;
  private decorationSet: DecorationSet;
  private editorView?: EditorView;

  private isInitialProofreadingDone = false;
  private lastOriginalFrom = 0;

  private readonly suggestionBox;

  constructor(proofreader: IProofreaderInterface, uiStrings?: IUiStrings, showSuggestionsEvent?: (word: string) => void) {
    this.proofreader = proofreader;
    this.uiStrings = uiStrings;
    this.showSuggestionsEvent = showSuggestionsEvent;
    this.decorationSet = DecorationSet.empty;

    this.suggestionBox = document.createElement('div');
    this.suggestionBox.className = 'suggestions-box';
    this.suggestionBox.tabIndex = 0;
    this.hideSuggestionBox();
  }

  public setDecorationSet(decorationSet: DecorationSet) {
    this.decorationSet = decorationSet;
  }

  public getDecorationSet(): DecorationSet {
    return this.decorationSet;
  }

  public setEditorView(editorView: EditorView) {
    this.editorView = editorView;
  }

  public getEditorView(): EditorView|undefined {
    return this.editorView;
  }

  public getSuggestionBox(): HTMLDivElement {
    return this.suggestionBox;
  }

  public hideSuggestionBox(): void {
    this.suggestionBox.textContent = '';
    this.suggestionBox.style.display = 'none';
  }

  /**
   * This function is called on initial load of the editor and when content is pasted into the editor. 
   * For manual modificaitons, only the changed nodes are spellchecked again. 
   * 
   * @param doc 
   */
  public proofreadDoc(doc: Node) {
    let textNodesWithPosition: ITextNodesWithPosition[] = [];

    let index = 0;
    doc?.descendants((node, pos) => {
      if (!node.isText) {
        index += 1;
        return true;
      }
  
      const localTextNode = {
        text: '',
        // tslint:disable-next-line:object-literal-sort-keys
        from: -1,
        to: -1,
      };
  
      if (textNodesWithPosition[index]) {
        localTextNode.text = textNodesWithPosition[index].text + node.text;
        localTextNode.from = textNodesWithPosition[index].from;
        localTextNode.to = localTextNode.from + localTextNode.text.length;
      } else {
        localTextNode.text = node.text || '';
        localTextNode.from = pos;
        localTextNode.to = pos + localTextNode.text.length;
      }
      textNodesWithPosition[index] = localTextNode;
    });

    textNodesWithPosition = textNodesWithPosition.filter(Boolean);

    let finalText = '';
    let lastPos = 1;
    for (const { text, from, to } of textNodesWithPosition) {
      const diff = from - lastPos;
      if (diff > 0) {
        finalText += Array(diff + 1).join(' ');
      }

      lastPos = to;
      finalText += text;
    }

    const request = this.getMatchAndSetDecorations(doc, finalText, 1);

    if (this.editorView) {
      this.dispatch(this.editorView.state.tr.setMeta(LOADING_TRANSACTION, true));
    }
    request.then(() => {
      if (this.editorView) {
        this.dispatch(this.editorView.state.tr.setMeta(LOADING_TRANSACTION, false));
      }
    });
  
    this.isInitialProofreadingDone = true;
  }

  public async getMatchAndSetDecorations (node: Node, text: string, originalFrom: number) {
    const matches = await this.proofreader.proofreadText(this.proofreader.normalizeTextForLanguage(text));

    const decorations: Decoration[] = [];
  
    for (const match of matches) {
      const docFrom = match.offset + originalFrom;
      const docTo = docFrom + match.length;
      decorations.push(Decoration.inline(docFrom, docTo, {
        class: 'spell-error',
        nodeName: 'span',
        word: JSON.stringify({ match, docFrom, docTo }),
      }));
    }
  
    const decorationsToRemove = this.decorationSet.find(originalFrom, originalFrom + text.length);
    this.decorationSet = this.decorationSet.remove(decorationsToRemove);
    this.decorationSet = this.decorationSet.add(node, decorations);
  
    if (this.editorView) {
      this.dispatch(this.editorView.state.tr.setMeta(SPELLCHECKER_TRANSACTION, true));
    }
  
    setTimeout(this.addEventListenersToDecorations.bind(this), 100);
  }

  public addEventListenersToDecorations () {
    const decorations = document.querySelectorAll('span.spell-error');
  
    if (!decorations.length) {
      return;
    }
  
    decorations.forEach((el) => {
      el.addEventListener('click', this.debouncedClickEventsListener);
    });
  }

  public addEventListenersToSuggestionBox() {
    const suggestions = this.suggestionBox.querySelectorAll('li');

    if (!suggestions.length) {
      return;
    }

    suggestions.forEach(sugg => {
      sugg.addEventListener('click', this.debouncedAcceptSuggestionEventsListener);
    });
  }

  public dispatch(tr: Transaction) {
    if (!this.editorView) {
      return;
    }
    this.editorView.dispatch(tr);
  }

  public findChangedTextNodes(node: Node, pos: number, from: number, to: number) {
    if (!node.isBlock) {
      return false;
    }

    if (!node.isTextblock) {
      node.descendants((nde, ps) => {
        this.findChangedTextNodes(nde, ps, from, to);
      });
      return false;
    }

    const [nodeFrom, nodeTo] = [pos, pos + node.nodeSize];
    if (!(nodeFrom <= from && to <= nodeTo)) {
      return;
    }

    const changedNodeWithPos = { node, pos };
    this.onNodeChanged(
      changedNodeWithPos.node,
      changedNodeWithPos.node.textContent,
      changedNodeWithPos.pos + 1,
    );
  }

  public onNodeChanged (node: Node, text: string, originalFrom: number) {
    if (originalFrom !== this.lastOriginalFrom) {
      this.getMatchAndSetDecorations(node, text, originalFrom);
    } else {
      this.debouncedGetMatchAndSetDecorations(node, text, originalFrom);
    }
  
    this.lastOriginalFrom = originalFrom;
  }

  private async clickEventsListener(e: Event) {
    if (!e.target) {
      return;
    }

    const matchString = (e.target as HTMLSpanElement).getAttribute('word')?.trim();

    if (!matchString) {
      console.error('No match string provided', {matchString});
      return;
    }

    const {match, docFrom, docTo} = JSON.parse(matchString);

    const suggestions = await this.proofreader.getSuggestions(this.proofreader.normalizeTextForLanguage(match.word));

    if (this.editorView) {
      // add suggestions
      this.addSuggestionsList(suggestions, docFrom, docTo);
      this.suggestionBox.style.display = '';

      // These are in screen coordinates
      const start = this.editorView.coordsAtPos(docFrom);
      const end = this.editorView.coordsAtPos(docTo);

      // The box in which the tooltip is positioned, to use as base
      const box = this.suggestionBox?.offsetParent?.getBoundingClientRect() || new DOMRect(0, 0);

      // Find a center-ish x position from the selection endpoints (when
      // crossing lines, end may be more to the left)
      const left = Math.max((start.left + end.left) / 2, start.left + 3);
      this.suggestionBox.style.left = (left - box.left) + 'px';
      this.suggestionBox.style.top = (start.bottom + 5 + window.scrollY) + 'px';

      if (this.showSuggestionsEvent) {
        this.showSuggestionsEvent(this.proofreader.normalizeTextForLanguage(match.word));
      }
    }

    this.addEventListenersToSuggestionBox();
    return false;
  }

  private acceptSuggestionListener(e: Event) {
    if (!e.target) {
      return;
    }

    const target = e.target as HTMLDivElement;

    const from = Number(target.dataset.from);
    const to = Number(target.dataset.to);

    if (this.editorView) {
      this.editorView.dispatch(this.editorView.state.tr.insertText(target.textContent || '', from, to));
    }
    this.hideSuggestionBox();
  }

  private addSuggestionsList(suggestions: string[], docFrom: number, docTo: number) {
    this.suggestionBox.textContent = '';

    const ul = document.createElement('ul');
    ul.className = 'suggestion-list';

    suggestions.forEach(sugg => {
      const li = document.createElement('li');
      li.innerText = sugg;
      li.dataset.from = docFrom + '';
      li.dataset.to = docTo + '';
      ul.appendChild(li);
    });
    this.suggestionBox.appendChild(ul);

    if (suggestions.length === 0) {
      const b = document.createElement('b');
      const noSuggestionsText = (!!this.uiStrings && !!this.uiStrings.noSuggestions) ? this.uiStrings.noSuggestions : 'No suggestions found';
      b.textContent = noSuggestionsText;
      this.suggestionBox.appendChild(b);
    }
  }
}
