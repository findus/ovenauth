import { Component, createResource, ErrorBoundary, onCleanup, onMount, Show } from "solid-js";
import { useService } from "solid-services";
import { StatService } from "./store/StatService";

interface ViewCountProps {
    viewers: string;
}

const ViewCount: Component<ViewCountProps> = (props) => {

    const viewers = () => {
        return props.viewers;
    };

    return (<h5>
        <Show when={props.viewers !== undefined} fallback={'Loading....'}>
            {viewers()}
        </Show>
    </h5>);
}

export default ViewCount;
