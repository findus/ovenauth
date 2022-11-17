import { Link } from "solid-app-router";
import {Component, createEffect, createResource, createSignal, For, onCleanup, onMount, Show} from "solid-js";
import { useService, } from "solid-services";
import Layout from "./Layout";
import { AuthService } from "./store/AuthService";
import Thumbnail from "./Thumbnail";
import Title from "./Title";
import ViewCount from "./ViewCount";
import {request} from "./webpush/web-push";
import {StatService} from "./store/StatService";

const Home: Component = () => {
    const authService = useService(AuthService);
    const statService = useService(StatService);
    let t;

    const [stats, { refetch }] = createResource(() => {
        return statService().getStats()
    });

    const fbpx = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const thumb = (stream: string) => {
        let thumb = stats()?.filter(e => e.name === stream).at(0)?.thumb ?? fbpx;
        return thumb;
    };

    const viewer = (stream: string) => {
        let viewer = stats()?.filter(e => e.name === stream).at(0)?.stats.response.totalConnections ?? "Offline";
        let temp =  viewer + ((viewer !== 'Offline') ? " Viewer" + ((viewer != 1) ? "s" : "") : "");
        return temp
    };

    let timeout;

    const update = () => {
        refetch();
        timeout = setTimeout(update, 10000);
    }

    createEffect(() => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            update();
        }, 10000);

        onCleanup(() => clearTimeout(timeout));
    });

    onMount(() => {
        authService().loadUsers()
        request();
    })

    return <>
        <Title value="Home"/>
        <Layout>
            <div class="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                <Show when={authService().loaded()}>
                    <For each={authService().users}>
                        {(user) =>
                            <div ref={t} class="aspect-video card shadow-xl card-bordered image-full">
                                <Thumbnail thumb={thumb(user.username)}></Thumbnail>
                                <div class="justify-end card-body">
                                    <h2 class="card-title">{user.username}</h2>
                                    <ViewCount viewers={viewer(user.username)}/>
                                    <div class="card-actions">
                                        <Link href={`/${user.username}`} class="btn btn-primary">Watch</Link>
                                    </div>
                                </div>
                            </div>
                        }
                    </For>
                </Show>
            </div>
        </Layout>
    </>;
};

export default Home;
