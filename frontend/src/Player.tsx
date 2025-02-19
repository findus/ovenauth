import {Component, createEffect, createSignal, JSX, onCleanup, onMount, Resource, splitProps} from "solid-js";
import OvenPlayer from 'ovenplayer';

export interface PlayerProps {
    url: string,
    autoplay: boolean,
    instance: string,
    scroll?: boolean,
    token: string,
    user: string,
    name: string
    viewcount: Resource<number>
}

// TODO: make this a directive instead of a component
const Stream: Component<PlayerProps & JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
    let ref: HTMLDivElement;

    const [offline, setOffline] = createSignal(false);
    const [playerProps, divProps] = splitProps(props, ['url', 'autoplay', 'instance', 'scroll']);
    let player;

    const getViewCount = () => {
        let count = props.viewcount();
        let lastState = offline();
        let nowOffline = count == -404 || count == -500;
        setOffline(nowOffline);
        return lastState != nowOffline && !nowOffline;
    };

    createEffect( () => {
        let viewCount = getViewCount();
        if (viewCount) { player.play(); }
    })

    onMount(() => {
        const [volume, setVolume] = createSignal(+(localStorage.getItem(`volume_${playerProps.instance}`) || 100));

        createEffect(() => localStorage.setItem(`volume_${playerProps.instance}`, volume().toString(10)));

        if (playerProps.scroll) {
            const doscroll = () => setTimeout(() => ref.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            }), 0);
            window.addEventListener('resize', doscroll);
            doscroll();

            onCleanup(() => window.removeEventListener('resize', doscroll));
        }

        const url = playerProps.url + "?username=" + props.user + "&token=" + props.token + "&streamname=" + props.name;

        player = OvenPlayer.create(ref.firstElementChild as HTMLDivElement, {
            volume: volume(),
            autoStart: playerProps.autoplay ?? false,
            webrtcConfig: {
                timeoutMaxRetry: 1000000,
                connectionTimeout: 5000
            },
            sources: [
                {
                    type: 'webrtc',
                    file: url,
                }
            ]
        });
        let timeout: number;
        player.once('ready', () => player.play());
        player.on('volumeChanged', n => setVolume(n.volume));
        player.on('stateChanged', s => {
            if (['playing', 'loading'].includes(s.prevstate) && s.newstate === 'error') {
                timeout = setTimeout(() => player.play(), 1000);
            }
        });

        onCleanup(() => {
            clearTimeout(timeout);
            player.remove();
        });
        player.play();
    });

    return (
        <div ref={ref} {...divProps}>
            <div></div>
        </div>
    );
};

export default Stream;
