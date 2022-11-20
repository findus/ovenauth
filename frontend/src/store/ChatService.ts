import { createSignal } from 'solid-js';
import { Connect } from 'vite';
import { ovenAuthClient } from './api';

const [getWebSocket, setWebSocket] = createSignal<WebSocket>();

export function ChatService() {
    const endpoint = import.meta.env.VITE_PROTOCOL + import.meta.env.VITE_BASEURL + (import.meta.env.VITE_APIPATH || '');

    return {
        connect() {
            setWebSocket(new WebSocket("ws://localhost:13337/ws"));
        },
        switchRoom(room: string) {
                console.log("Switch to " + room);
                getWebSocket().send("/join " + room);
        },
        getClient() {
            return getWebSocket()
        }
    }
}
