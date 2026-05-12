import {App, PluginSettingTab, Setting} from "obsidian";
import PixelPicker from "./main";

export interface PixelPickerSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: PixelPickerSettings = {
	mySetting: 'default'
}

export class PixelPickerSettingTab extends PluginSettingTab {
	plugin: PixelPicker;

	constructor(app: App, plugin: PixelPicker) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
