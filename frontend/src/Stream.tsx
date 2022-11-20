import { useParams } from "solid-app-router";
import {Component, createEffect, createResource, createSignal, For, onCleanup, onMount, Show} from "solid-js";
import { useService } from "solid-services";
import Player from "./Player";
import {ChatService } from "./store/ChatService";
import {AuthService} from "./store/AuthService";
import {StatService} from "./store/StatService";
import {viewCounter} from "./directives/viewCounter";

viewCounter

const Stream: Component = () => {
    const params = useParams();
    const chatService = useService(ChatService)
    const statService = useService(StatService);
    const authService = useService(AuthService);

    const endpoint = import.meta.env.VITE_BASEURL;

    const css = {
        'aspect-ratio': '16 / 9',
        'max-width': '100%',
        'max-height': '100vh',
        margin: '0 auto'
    };


    const loginFallback = <div style={{'text-align': 'center', 'font-size': '5vh'}}>Please log in</div>
    const whitelistFallback = <div style={{'text-align': 'center', 'font-size': '5vh'}}>No permission granted to watch this stream :(</div>
    const offline = <div style={{'text-align': 'center', 'font-size': '5vh'}}>Offline :(</div>


    const [allowedResource, {  }] = createResource(() => {
        return authService().allowedToWatch(params.user).catch(() => false);
    });

    const allowed = () => {
        return allowedResource();
    };


    const fetcher = (name: string) => statService().getViewers(name);

    const [vc, { refetch }] = createResource(() => params.user, fetcher);

    const interval = 10000;
    const i = setInterval(() => refetch(), interval);
    onCleanup(() => clearInterval(i));

    const getViewCount = () => {
        let count = vc();
        return count;
    };

    onMount(() =>{
        chatService().setRoom(params.user);
    })

    onCleanup(() => {
        chatService().setRoom("fluss");
    })

    return (
        <>
            <div class="flex">
                <div class="flex-grow">
                  <Show  when={(authService().token !== 'uninit') || allowed()} fallback={loginFallback}>
                        <div use:viewCounter={[vc, params.user]}></div>
                        <div>
                            <Show when={!allowedResource.loading && allowed()} fallback={whitelistFallback}>
                                <Show when={getViewCount() !== -500 && authService().token !== 'loading'} fallback={offline}>
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
                            </Show>
                        </div>
                  </Show>
                </div>
                <aside class="w-64" aria-label="Sidebar">
                    <div class="overflow-y-auto py-4 px-3 bg-neutral rounded overflow-y-auto">
                        <ul class="space-y-2">
                            <For each={chatService().viewers}>
                                {(viewer) =>
                                    <li>
                                        <a href="#" class="overflow-x-hidden flex items-center p-2 text-base font-normal text-base-content rounded-lg dark:text-white dark:hover:bg-gray-700">
                                            <svg aria-hidden="true" class="min-w-[20px] max-w-[20px] w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/> <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/> </svg>
                                            <span class="ml-3">{viewer.split("_")[1]}</span>
                                        </a>
                                    </li>
                                }
                            </For>
                        </ul>
                    </div>
                </aside>
            </div>
        </>
    );
};

export default Stream;
