import {Component, createEffect, createResource, createSignal, ErrorBoundary, onCleanup, onMount, Show} from "solid-js";

const Thumbnail: Component<{ thumb: string, viewers: string }> = (props) => {

    const fbpx = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    return (
        <figure class="aspect-video">
            <ErrorBoundary fallback={<img class="bg-gradient-to-tl from-neutral-content to-neutral" src={fbpx} />}>
                <Show when={props.viewers !== "Offline"} fallback={<img class="bg-gradient-to-tl from-neutral-content to-neutral" src={fbpx} /> }>
                    <img class="bg-gradient-to-tl from-neutral-content to-neutral" src={'data:image/jpeg;base64,' + props.thumb} />
                </Show>
            </ErrorBoundary>
        </figure>
    )
}

export default Thumbnail;
