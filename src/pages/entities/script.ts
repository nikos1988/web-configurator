import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../utilities/dependency-injection';
import { YioStore } from '../../store';
import { IEntity, IKeyValuePair } from '../../types';
import YioTable from '../../components/table/index.vue';
import ActionIconButton from '../../components/action-icon-button/index.vue';
import AvailableEntities from '../../components/sub-menus/available-entities/index.vue';

@Component({
	name: 'EntitiesPage',
	components: {
		YioTable,
		ActionIconButton
	},
	subscriptions(this: EntitiesPage) {
		return {
			configured: this.store.entities.configured,
			available: this.store.entities.available
		};
	}
})
export default class EntitiesPage extends Vue {
	@Inject(() => YioStore)
	public store: YioStore;
	public configured: IEntity[] = [];
	public available: IKeyValuePair<IEntity[]> = {};

	public onItemDeleted(item: IEntity) {
		alert(`TODO: Remove Entity --> ${item.friendly_name}`);
	}

	public mounted() {
		this.$menu.show(AvailableEntities, {});
	}

	public beforeDestroy() {
		this.$menu.hide();
	}
}
