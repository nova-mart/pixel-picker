import {App, TFile, Modal, Notice, Plugin, Setting} from 'obsidian';
import {DEFAULT_SETTINGS, PixelPickerSettings, PixelPickerSettingTab} from "./settings";
import {ImageSuggest} from "./suggest";

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
		const setX = contUserInputs.createDiv({ cls: 'coor' });
		const setY = contUserInputs.createDiv({ cls: 'coor' });
		const submit = contUserInputs.createDiv({ cls: 'entry' });
	
		const contUserOutputs = this.contentEl.createDiv({ cls: 'outputs' });

		const dispImage = contUserOutputs.createDiv({ cls: 'imageDim' });
		const dispLens = contUserOutputs.createDiv({ cls: 'zoom-lens' });
		const dispHex = contUserOutputs.createDiv({ cls: 'entry' });

	let imageName = '';
	new Setting(setName)
        .setName("Select image")
        .setDesc("Type to search for vault images...")
        .addText((text) => {

            text.setPlaceholder("path/to/image.png");
			text.inputEl.style.width = "100%"; // eslint-disable-line
            
            new ImageSuggest(this.app, text.inputEl, (selectedTargetValue) => { // on dropdown selection
				
				imageName = selectedTargetValue;
				text.setValue(selectedTargetValue); // reflect selection to user
				/* eslint-disable */
				setX.style.display = 'block'; // display XY options now that a valid image was selected
				setY.style.display = 'block';
				/* eslint-enable */

       		});

			text.onChange(() => { // hide XY options as there is no valid image selected

				imageName = '';
				/* eslint-disable */
				setX.style.display = 'none';
				setY.style.display = 'none';
				/* eslint-enable */

			});

    });

	let xCoor = 0;
    const xSett = new Setting(setX)
      	.setName('X coordiate of pixel')
      	.addText((text) =>
			text.onChange((value) => {

				if (/[a-zA-Z]/.test(value) || /[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(value)) {
					updateSettingStatus(true, xSett);
				} else {
					xCoor = parseInt(value, 10);
					updateSettingStatus(false, xSett);
				}

			}));

	let yCoor = 0;
    const ySett = new Setting(setY)
      	.setName('Y coordinate of pixel')
      	.addText((text) =>
			text.onChange((value) => {

				if (/[a-zA-Z]/.test(value) || /[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(value)) {
					updateSettingStatus(true, ySett);
				} else {
					yCoor = parseInt(value, 10);
					updateSettingStatus(false, ySett);
				}

			}));

	function updateSettingStatus(hasError: boolean, aCoorEntry: Setting) {
		if (hasError) {
			aCoorEntry.setDesc("Invalid input! Please enter integers only.");
			aCoorEntry.descEl.style.color = "var(--text-error)"; // eslint-disable-line
		} else {
			aCoorEntry.setDesc("");
			aCoorEntry.descEl.style.color = "var(--text-muted)"; // eslint-disable-line
		}
	}

    new Setting(submit)
      	.addButton((btn) =>
        	btn
				.setButtonText('Submit')
				.setCta()
				.onClick(() => {

					onSubmit(imageName);	

					interface ImageColorResult {
						color: string;
						height: number;
						width: number;
					}

					async function getImageColor(imagePath: string, x: number, y: number): Promise<ImageColorResult> {
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
									resolve({
										color: '#000000',
										height: 0,
										width: 0
									});
									return;
								}

								const r = Number(pixel[0]) || 0;
								const g = Number(pixel[1]) || 0;
								const b = Number(pixel[2]) || 0;

								const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
								resolve({
									color: hex,
									height: img.naturalHeight,
									width: img.naturalHeight
								});

							};

							img.onerror = () => reject(new Error("Failed to load image"));
							img.src = imagePath;

							dispImage.empty(); // clear previous image
							dispImage.append(img); // display new image

							/* eslint-disable */
							dispLens.style.backgroundImage = `url('${img.src}')`; // set lens image
							dispLens.style.display = 'block'; // make lens visible
							/* eslint-enable */

					});
					}

					void (async () => {

						const file = this.app.vault.getAbstractFileByPath(imageName);
						if (file instanceof TFile) {

							const path = this.app.vault.getResourcePath(file);
							const answer = await getImageColor(path, xCoor, yCoor);

							dispHex.style.color = answer.color;
							dispHex.textContent = `hex = ${answer.color}`;
							
							// rescale the selected coordinates from the original image to the displayed image in modal
							// center the lens on selected pixel
							dispLens.style.left = `${xCoor/answer.width*dispImage.clientWidth - dispLens.offsetWidth / 2}px`;
							dispLens.style.top = `${yCoor/answer.height*dispImage.clientHeight - dispLens.offsetHeight / 2}px`;

							// zoom on the original image rescaling the chosen coordinates to show pixel data
							// center the lens on selected pixel
							let zoomLevel = 5;
							dispLens.style.backgroundSize = `${answer.width * zoomLevel}px ${answer.height * zoomLevel}px`;
							const bgX = (xCoor * zoomLevel) - (dispLens.offsetWidth / 2);
							const bgY = (yCoor * zoomLevel) - (dispLens.offsetHeight / 2);
							dispLens.style.backgroundPosition = `-${bgX}px -${bgY}px`;
							dispLens.style.borderColor = answer.color;
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
