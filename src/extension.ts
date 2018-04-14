"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(ctx: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "8novels-charactercount" is now active!');

    // create a new character counter
    let characterCounter = new CharacterCounter();
    let controller = new CharacterCounterController(characterCounter);

    // add to a list of disposables which are disposed when this extension
    // is deactivated again.
    ctx.subscriptions.push(controller);
    ctx.subscriptions.push(characterCounter);
}

export class CharacterCounter {

    private _statusBarItem!: StatusBarItem;

    public updateCharacterCount() {
        
        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        } 

        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        // Markdownとプレーンテキストの時だけカウント
        if (doc.languageId === "markdown" || doc.languageId === "plaintext") {
            let characterCount = this._getCharacterCount(doc);

            // Update the status bar
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

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._characterCounter.updateCharacterCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}
