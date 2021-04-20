"use strict";
import { window, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, workspace } from 'vscode';
export function activate(context: ExtensionContext) {
    let characterCounter = new CharacterCounter();
    let controller = new CharacterCounterController(characterCounter);
    context.subscriptions.push(controller);
    context.subscriptions.push(characterCounter);
}

export class CharacterCounter {

    private _statusBarItem!: StatusBarItem;
    public updateCharacterCount() {
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        } 
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }
        let doc = editor.document;

        // Markdownとプレーンテキストの時だけカウント
        let mylanguage = workspace.getConfiguration('charactercount').get('supporting.language');
        if (doc.languageId === "markdown" || doc.languageId === "plaintext" || doc.languageId === mylanguage) {
                let characterCount = this._getCharacterCount(doc);
            this._statusBarItem.text = `$(pencil) ${characterCount} 文字`;
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    public _getCharacterCount(doc: TextDocument): number {
        let docContent = doc.getText();
        // カウントに含めない文字を削除する
        docContent = docContent
            .replace(/\s/g, '') // すべての空白文字
            .replace(/《(.+?)》/g, '')  // ルビ範囲指定記号とその中の文字
            .replace(/[\|｜]/g, '');    // ルビ開始記号
        let characterCount = 0;
        if (docContent !== "") {
            characterCount = docContent.length;
        }
        return characterCount;
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}

class CharacterCounterController {

    private _characterCounter: CharacterCounter;
    private _disposable: Disposable;

    constructor(characterCounter: CharacterCounter) {
        this._characterCounter = characterCounter;
        this._characterCounter.updateCharacterCount();

        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._characterCounter.updateCharacterCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}
