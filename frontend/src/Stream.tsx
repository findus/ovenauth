import { useParams } from "solid-app-router";
import {Component, createEffect, createResource, onCleanup, Show} from "solid-js";
import { useService } from "solid-services";
import Player from "./Player";
import {AuthService} from "./store/AuthService";
import { viewCounter } from "./directives/viewCounter"
import {StatService} from "./store/StatService";

viewCounter

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

    authService().refreshToken()

    const loginFallback = <div style={{'text-align': 'center', 'font-size': '5vh'}}>Du musschd di jedzd abr scho no neilogga weischt?</div>
    const whitelistFallback = <div style={{'text-align': 'center', 'font-size': '5vh'}}>Du bisch leidr ned whidelischded :(</div>


    const [allowedResource, {  }] = createResource(() => {
        return authService().allowedToWatch(params.user).catch(() => false);
    });

    const allowed = () => {
        return allowedResource();
    };

    const statService = useService(StatService);

    const fetcher = (name: string) => statService().getViewers(name);

    const [vc, { refetch }] = createResource(() => params.user, fetcher);

    const interval = 10000;
    const i = setInterval(() => refetch(), interval);
    onCleanup(() => clearInterval(i));

    return (
        <>
            <Show when={(authService().token !== 'uninit') || allowed()} fallback={loginFallback}>
                <div use:viewCounter={[vc, params.user]}></div>
                <div>
                    <Show when={!allowedResource.loading && allowed()} fallback={whitelistFallback}>
                        <Player
                            style={css}
                            url={`wss://${endpoint}/ws/${params.user}`}
                            name={params.user}
                            instance={params.user} autoplay={true}
                            scroll={true}
                            token={authService().token}
                            user={authService().user.username}
                            viewcount={vc}
                            id="player">
                        </Player>
                    </Show>
                </div>
            </Show>
        </>
    );
};

export default Stream;
