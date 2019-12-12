import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import DeleteButton from '../delete-icon-button/index.vue';

function padZero(num: number): string {
    return (num < 10) ? `0${num}` : `${num}`;
}

@Component({
    name: 'CardList',
    components: {
        DeleteButton
    },
    subscriptions(this: RemoteControl) {
        return {
            time: timer(0, 1000).pipe(map(() => {
                const now = new Date();
                return `${padZero(now.getHours())}:${padZero(now.getMinutes())}`;
            }))
        };
    }
})
export default class RemoteControl extends Vue {
    @Prop({
        type: Array,
        default: []
    })
    public entities: any[];

    public onDeleteEntity(entity: any) {
        alert(`TODO: Remove ${entity.name}`);
    }
}