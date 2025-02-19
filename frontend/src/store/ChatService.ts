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
    const websocket = import.meta.env.VITE_WS_PROTOCOl + import.meta.env.VITE_BASEURL + "/chat"
    const [viewerList, setViewerlist] = createSignal();
    const [chatMessages, setChatMessages] = createSignal([]);
    const [room, setRoom] = createSignal("fluss");
    const [connect, disconnect, send, state, socket] = createWebsocket(
        websocket,
        (msg) => {
            function add(joinmsg) {
                let data = chatMessages().concat([joinmsg]);
                if (data.length > 1000) {
                    data = data.shift();
                }
                setChatMessages(data)
            }

            if (msg.data.startsWith("VIEWERS")) {
                let viewers = JSON.parse(msg.data.replace("VIEWERS ", ""))?.viewers;
                setViewerlist(viewers)
            } else if (msg.data.startsWith("USERUPDATE")) {
                let joinmsg = msg.data.replace("USERUPDATE ", "").split(/_(.*)/s).slice(1)
                add(joinmsg);
            } else {
                add(msg.data.replace("MESSAGE ", ""))
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
            setChatMessages([]);
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
        send(msg: string) {
            send(msg)
        },
        get viewers() {
            return viewerList();
        },
        get chatmessages() {
            return chatMessages();
        },
        get state() {
            return state();
        }
    }
}
