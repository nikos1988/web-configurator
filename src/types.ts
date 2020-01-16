import Vue, { VueConstructor, PropOptions } from 'vue';
import { LocaleMessageObject } from 'vue-i18n';

// Store Types
export interface IStoreState {
	// tslint:disable-next-line:no-any
	[stateSliceKey: string]: any;
}

// tslint:disable-next-line:no-any
export interface IEmptyAction<T = any> {
	type: T;
}

// tslint:disable-next-line:no-any
export interface IAction<T = any> {
	type: T;
	// tslint:disable-next-line:no-any
	payload: any;
	// tslint:disable-next-line:no-any
	meta: any;
}

export interface IAnyEmptyAction extends IEmptyAction {
	// tslint:disable-next-line:no-any
	[extraProps: string]: any;
}

export interface IAnyAction extends IAction {
	// tslint:disable-next-line:no-any
	[extraProps: string]: any;
}

// tslint:disable-next-line:no-any
export type Reducer<S = any, A extends IAction = IAnyAction> = (state: S, action: A) => S;

// tslint:disable-next-line:no-any
export type ReducersMapObject<S = any, A extends IAction = IAction> = {
	[K in keyof S]: Reducer<S[K], A>;
};

export type Reducers<S> = {
	[K in keyof S]: Reducer<S[K]>;
};

export type UpdateFromServer = boolean | undefined;

// State Types
export interface IKeyValuePair<T> {
	[key: string]: T;
}

export interface ISettings {
	language: string;
	autobrightness: boolean;
	proximity: number;
	shutdowntime: number;
	softwareupdate: boolean;
	wifitime: number;
	bluetootharea: boolean;
	paired_dock: string;
}

export interface IProfile {
	name: string;
	pages: string[];
	favorites: string[];
}

export interface IPage {
	name: string;
	groups: string[];
	image?: string;
	bluetooth?: string;
}

export interface IGroup {
	name: string;
	switch: boolean;
	entities: string[];
}

export interface IEntity {
	entity_id: string;
	friendly_name: string;
	integration: string;
	supported_features: string[];
}

export interface IIntegrationData {
	friendly_name: string;
	id: string;
	data?: {
		ip?: string;
	};
}

export interface IIntegration {
	mdns?: string;
	data: IIntegrationData[];
}

export interface IUiConfig {
	darkmode: boolean;
	selected_profile: number;
	profiles: IKeyValuePair<IProfile>;
	pages: IKeyValuePair<IPage>;
	groups: IKeyValuePair<IPage>;
}

export interface IConfigState {
	settings: ISettings;
	ui_config: IUiConfig;
	entities: IKeyValuePair<IEntity[]>;
	integrations: IKeyValuePair<IIntegration>;
}

export interface IState {
	config: IConfigState;
}

// Locale
export interface ILocale extends LocaleMessageObject {
	settingsPage: {
		darkMode: string;
		autoBrightness: string;
	};
	disconnectionOverlay: {
		title: string;
		message: string;
		reconnecting: string;
	};
}

// Plugins
export interface IMenuPlugin {
	component?: VueConstructor<Vue>;
	props?: PropOptions;
}

export interface IContextMenu {
	hide(): void;
	// tslint:disable-next-line:no-any
	show<T extends object>(component: VueConstructor<Vue>, props: T): void;
	updateProps<T extends object>(props: T): void;
}

// Components
export interface ICardComponent extends Vue {
	isSelected: boolean;
	setSelected(isSelected: boolean): void;
}

export interface ICardListComponent extends Vue {
	addCard(card: ICardComponent): void;
	selectCard(cardToSelect: ICardComponent): void;
}

export interface ITabComponent extends Vue {
	setIsActive(isActive: boolean): void;
	selectCard(cardToSelect: ICardComponent): void;
}
