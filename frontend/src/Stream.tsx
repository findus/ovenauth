import { useParams } from "solid-app-router";
import {Component, createResource, Show} from "solid-js";
import Title from "./Title";
import Player from "./Player";
import {useService} from "solid-services";
import {AuthService} from "./store/AuthService";

const Stream: Component = () => {
    const params = useParams();

    const endpoint = import.meta.env.VITE_BASEURL;

    const css = {
        'aspect-ratio': '16 / 9',
        'max-width': '100%',
        'max-height': '100vh',
        margin: '0 auto'
    };

    const authService = useService(AuthService);

    const loginFallback = <div style={{'text-align': 'center', 'font-size': '5vh'}}>Du musschd di jedzd abr scho no neilogga weischt?</div>
    const whitelistFallback = <div style={{'text-align': 'center', 'font-size': '5vh'}}>Du bisch leidr ned whidelischded :(</div>

    const [token, { refetch }] = createResource(() => {
        return authService().getToken();
    });

    const accessToken = () => {
        return token();
    };

    const [allowedResource, {  }] = createResource(() => {
        return authService().allowedToWatch(params.user);
    });

    const allowed = () => {
        return allowedResource();
    };

    return (
        <>
            <Title value={params.user} />
            <div>
                <Show when={(!token.loading || typeof token() === 'string') && token() !== 'error'} fallback={loginFallback}>
                    <Show when={!allowedResource.loading && allowed()} fallback={whitelistFallback}>
                        <Player
                            style={css}
                            url={`wss://${endpoint}/ws/${params.user}`}
                            name={params.user}
                            instance={params.user} autoplay={true}
                            scroll={true}
                            token={accessToken()}
                            user={authService().user.username}
                            id="player">
                        </Player>
                    </Show>
                </Show>
            </div>
        </>
    );
};

export default Stream;
