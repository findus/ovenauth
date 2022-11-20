import {createEffect, createSignal, onCleanup} from "solid-js";

const createWebsocket = (
    url: string,
    onData: (message: MessageEvent) => void,
    onError: (message: Event) => void,
    protocols?: string | Array<string>,
    reconnectLimit?: number,
    reconnectInterval?: number
): [
    connect: () => void,
    disconnect: () => void,
    send: (message: string) => void,
    state: () => number,
    socket: () => WebSocket
] => {
    let socket: WebSocket;
    let reconnections = 0;
    let reconnectId: ReturnType<typeof setTimeout>;
    const [state, setState] = createSignal(WebSocket.CLOSED);
    const send = (data: string | ArrayBuffer) => socket.send(data);
    const cancelReconnect = () => {
        if (reconnectId) {
            clearTimeout(reconnectId);
        }
    };
    const disconnect = () => {
        cancelReconnect();
        reconnectLimit = Number.NEGATIVE_INFINITY;
        if (socket) {
            socket.close();
        }
    };
    // Connect the socket to the server
    const connect = () => {
        cancelReconnect();
        setState(WebSocket.CONNECTING);
        socket = new WebSocket(url, protocols);
        socket.onopen = () => setState(WebSocket.OPEN);
        socket.onclose = () => {
            setState(WebSocket.CLOSED);
            if (reconnectLimit && reconnectLimit > reconnections) {
                reconnections += 1;
                reconnectId = setTimeout(connect, reconnectInterval);
            }
        };
        socket.onerror = onError;
        socket.onmessage = onData;
    };
    onCleanup(() => disconnect);
    return [connect, disconnect, send, state, () => socket];
};


export function ChatService() {
    const endpoint = import.meta.env.VITE_PROTOCOL + import.meta.env.VITE_BASEURL + (import.meta.env.VITE_APIPATH || '');
    const websocket = "wss://" + import.meta.env.VITE_BASEURL + "/chat"
    const [viewerList, setViewerlist] = createSignal();
    const [room, setRoom] = createSignal("fluss");
    const [connect, disconnect, send, state, socket] = createWebsocket(
        websocket,
        (msg) => {
            if (msg.data.includes("viewers")) {
                let viewers = JSON.parse(msg.data)?.viewers;
                setViewerlist(viewers)
            }
        },
        (msg) => console.log("error", msg),
        [],
        5,
        5000
    );

    if (state() !== WebSocket.CONNECTING) {
        connect()
    }

    createEffect(() => {
        if (room() !== undefined && state() == WebSocket.OPEN) {
            switchRoom(room())
        }
    });

    function switchRoom(room: string) {
        if (state() == WebSocket.OPEN) {
            send("/join " + room);
        }
    }

    return {
        reconnect() {
            disconnect();
            connect()
        },
        setRoom(room: string) {
            setRoom(room);
        },
        get viewers() {
            return viewerList();
        }
    }
}
