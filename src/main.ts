import {App, Modal, Notice, Plugin, Setting} from 'obsidian';
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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PixelPickerSettingTab(this.app, this));

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
