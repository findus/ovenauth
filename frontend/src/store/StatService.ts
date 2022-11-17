import { ovenAuthClient } from './api';
import {Stats} from "../types/user.interface";

export function StatService(user: string) {
    const endpoint = import.meta.env.VITE_PROTOCOL + import.meta.env.VITE_BASEURL + (import.meta.env.VITE_APIPATH || '');
    const client = ovenAuthClient(endpoint);

    return {
        getViewers(user: string): Promise<number> {
            return client.stats.viewerCount(user);
        },
        getStats(): Promise<Array<Stats>> {
            return client.stats.stats();
        }
    }
}
