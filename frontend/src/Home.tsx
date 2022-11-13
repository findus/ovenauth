import { Link } from "solid-app-router";
import {Component, For, onMount, Show} from "solid-js";
import { useService } from "solid-services";
import Layout from "./Layout";
import { AuthService } from "./store/AuthService";
import Thumbnail from "./Thumbnail";
import Title from "./Title";
import ViewCount from "./ViewCount";
import {request} from "./webpush/web-push";

const Home: Component = () => {
    const authService = useService(AuthService);
    let t;

    onMount(() => {
        authService().loadUsers()
    })

    return <>
        <Title value="Home"/>
        <Layout>
            <div class="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                <Show when={authService().loaded()}>
                    <For each={authService().users}>
                        {(user) =>
                            <div ref={t} class="aspect-video card shadow-xl card-bordered image-full">
                                <Thumbnail hover={t} interval={10000} name={user.username} token={authService().token} username={authService().user.username}></Thumbnail>
                                <div class="justify-end card-body">
                                    <h2 class="card-title">{user.username}</h2>
                                    <Show when={authService().loaded()} fallback={"?"}>
                                        <ViewCount interval={10000} name={user.username} user={authService().user.username} token={authService().token}/>
                                    </Show>
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
