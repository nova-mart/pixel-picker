import { AbstractInputSuggest, App, TFile } from "obsidian";

export class ImageSuggest extends AbstractInputSuggest<TFile> {

    private inputElement: HTMLInputElement;
    private imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'svg'];

    constructor(app: App, textInputEl: HTMLInputElement) {
        super(app, textInputEl);
        this.inputElement = textInputEl;
    }

    getSuggestions(inputStr: string): TFile[] {

        const lowerInput = inputStr.toLowerCase(); // conduct a non-case sensitive search

        return this.app.vault.getFiles().filter(file => { // for each file

            const isImage = this.imageExtensions.includes(file.extension.toLowerCase()); // allow list check
            const matchesInput = file.path.toLowerCase().includes(lowerInput);
            return isImage && matchesInput;

        });

    }

    renderSuggestion(file: TFile, el: HTMLElement): void {

        el.createEl("div", { text: file.name });
        el.createEl("small", { text: file.path, cls: "suggestion-note" });

    }

    selectSuggestion(file: TFile): void {

        this.inputElement.value = file.path;
        this.inputElement.trigger("input"); // force notify the event listener
        this.close();

    }
    
}