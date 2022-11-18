import { ovenAuthClient } from './api';
import {Recording, VodInfo} from "../types/user.interface";

export function RecordService() {
    const endpoint = import.meta.env.VITE_PROTOCOL + import.meta.env.VITE_BASEURL + (import.meta.env.VITE_APIPATH || '');
    const client = ovenAuthClient(endpoint);

    return {
        startRecord(): Promise<void> {
            return client.record.startRecord();
        },
        stopRecord(): Promise<void> {
            return client.record.stopRecord();
        },
        status(): Promise<Recording[]> {
            return client.record.status();
        },
        vods(stream: string, token: string): Promise<VodInfo[]> {
            return client.record.getVods(stream, token);
        }
    }
}
