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

	// divs
	const contUserInputs = this.contentEl.createDiv({ cls: 'inputs' });
		const setName = contUserInputs.createDiv({ cls: 'entry' });
			//const errName = contUserInputs.createDiv({ cls: 'correction' });
		const setX = contUserInputs.createDiv({ cls: 'entry' });
			const errX = contUserInputs.createDiv({ cls: 'correction' });
		const setY = contUserInputs.createDiv({ cls: 'entry' });
			const errY = contUserInputs.createDiv({ cls: 'correction' });
		const submit = contUserInputs.createDiv({ cls: 'entry' });
	const contUserOutputs = this.contentEl.createDiv({ cls: 'outputs' });
		const dispHex = contUserOutputs.createDiv({ cls: 'entry' });

	let imageName = '';
    new Setting(setName)
      	.setName('What\'s the filepath of your image?')
      	.addText((text) =>
			text.onChange((value) => {
				imageName = value;
			}));

	let xCoor = 0;
    new Setting(setX)
      	.setName('X coordiate of pixel')
      	.addText((text) =>
			text.onChange((value) => {
					errX.empty();
					if (/[a-zA-Z]/.test(value) || /[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(value)) {
						errX.textContent = "Invalid input! Please enter integers only.";
					}else{
						xCoor = parseInt(value, 10);
					}
			}));

	let yCoor = 0;
    new Setting(setY)
      	.setName('Y coordinate of pixel')
      	.addText((text) =>
			text.onChange((value) => {
				errY.empty();
				if (/[a-zA-Z]/.test(value) || /[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(value)) {
					errY.textContent = "Invalid input! Please enter integers only.";
				}else{
					yCoor = parseInt(value, 10);
				}
			}));

    new Setting(submit)
      	.addButton((btn) =>
        	btn
				.setButtonText('Submit')
				.setCta()
				.onClick(() => {

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
							dispHex.textContent = `hex = ${answer}`;
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
