import {App, TFile, Modal, Notice, Plugin, Setting} from 'obsidian';
import {DEFAULT_SETTINGS, PixelPickerSettings, PixelPickerSettingTab} from "./settings";

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

	// TODO: create containers BEFORE you put the settings input in

	let imageName = '';
    new Setting(this.contentEl)
      	.setName('What\'s the filepath of your image?')
      	.addText((text) =>
			text.onChange((value) => {
				imageName = value;
			}));

	let xCoor = 0;
    new Setting(this.contentEl)
      	.setName('X coordiate of pixel')
      	.addText((text) =>
			text.onChange((value) => {
					if (!/^\d+$/.test(value)) {
						new Notice("Invalid input! Please enter only integers.");
						// TODO: display notification underneath the textbox
					}else{
						xCoor = parseInt(value, 10);
					}
			}));

	let yCoor = 0;
    new Setting(this.contentEl)
      	.setName('Y coordinate of pixel')
      	.addText((text) =>
			text.onChange((value) => {
				if (!/^\d+$/.test(value)) {
    				new Notice("Invalid input! Please enter only integers.");
					// TODO: display notification underneath the textbox
				}else{
					yCoor = parseInt(value, 10);
				}
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

					async function getImageColor(imagePath: string, x: number, y: number): Promise<string> {
						return new Promise((resolve, reject) => {

							const img = new Image();
							const canvas = document.createElement('canvas');
							const ctx = canvas.getContext('2d', { willReadFrequently: true });

							img.onload = () => {

								canvas.width = img.naturalWidth;
								canvas.height = img.naturalHeight;
								ctx?.drawImage(img, 0, 0);

								const pixel = ctx?.getImageData(x, y, 1, 1).data;
								if (!pixel) {
									resolve('#000000');
									return;
								}

								const [r, g, b] = pixel;
								const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
								resolve(hex);

						};

						img.onerror = () => reject(new Error("Failed to load image"));
						img.src = imagePath;

					});
					}

					void (async () => {

						const file = this.app.vault.getAbstractFileByPath(imageName);
						if (file instanceof TFile) {
							const path = this.app.vault.getResourcePath(file);
							const answer = await getImageColor(path, xCoor, yCoor);
							container.createDiv({ text: `hex = ${answer}`, cls: 'item-class' });
						}	
						
					})().catch(err => console.error("Error in color picker context:", err));


				})); 
 	}

	onOpen() {}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
		new Notice("Closed modal");
	}
}
