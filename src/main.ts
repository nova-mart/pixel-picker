import {App, Editor, MarkdownView, Modal, Notice, Plugin, Setting} from 'obsidian';
import {DEFAULT_SETTINGS, PixelPickerSettings, PixelPickerSettingTab} from "./settings";

// Remember to rename these classes and interfaces!

export default class PixelPicker extends Plugin {
	settings: PixelPickerSettings;

	async onload() {
		await this.loadSettings();

        this.addRibbonIcon('palette', 'Toggle icon', () => {
			new PixelPickerModal(this.app, (result) => {
  				new Notice(`Hello, ${result}!`);
			}).open();
        });

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Open modal (simple)',
			callback: () => {
				new PixelPickerModal(this.app, (result) => {
  					new Notice(`Hello, ${result}!`);
				}).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'replace-selected',
			name: 'Replace selected content',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection('Sample editor command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-modal-complex',
			name: 'Open modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new PixelPickerModal(this.app, (result) => {
  							new Notice(`Hello, ${result}!`);
						}).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
				return false;
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PixelPickerSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', () => {
			new Notice("Click");
		});

	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PixelPickerSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class PixelPickerModal extends Modal {
	constructor(app: App, onSubmit: (result: string) => void) {
    	super(app);
			this.setTitle('Pixel picker');

	let imageName = '';
    new Setting(this.contentEl)
      	.setName('What\'s the filepath of your image?')
      	.addText((text) =>
			text.onChange((value) => {
				imageName = value;
			}));

	let xCoor = '';
    new Setting(this.contentEl)
      	.setName('X coordiate of pixel')
      	.addText((text) =>
			text.onChange((value) => {
				xCoor = value;
			}));

	let yCoor = '';
    new Setting(this.contentEl)
      	.setName('Y coordinate of pixel')
      	.addText((text) =>
			text.onChange((value) => {
				yCoor = value;
			}));

    new Setting(this.contentEl)
      	.addButton((btn) =>
        	btn
				.setButtonText('Submit')
				.setCta()
				.onClick(() => {

					// this.contentEl.empty(); // empty the container on submit
					const container = this.contentEl.createDiv({ cls: 'my-container-class' });
					container.createDiv({ text: `Image = ${imageName}`, cls: 'item-class' });
    				container.createDiv({ text: `X = ${xCoor}`, cls: 'item-class' });
					container.createDiv({ text: `Y = ${yCoor}`, cls: 'item-class' });

					onSubmit(imageName);
				}));
 	}

	onOpen() {}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
		new Notice("Closed modal");
	}
}
