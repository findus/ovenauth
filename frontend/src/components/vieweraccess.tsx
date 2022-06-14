import {Component, createResource, For, Show} from "solid-js";
import { AuthService } from "../store/AuthService";
import {useService} from "solid-services";

const ViewerAccess: Component = () => {

    const authService = useService(AuthService);

    const [viewers, { refetch }] = createResource(() => {
        return authService().allowedUsers();
    });

    function togglePermission(el, viewer) {
        const checked = el.target.checked;
        authService().setViewerPermission(viewer.username, checked).then(_ => refetch()).catch((e) => console.log("Setting permissions did not work",e));
    }

    const fallback = <h1 style={{'text-align': 'center', 'font-size': '5rem'}}></h1>;

    return (
        <>
            <Show when={(!viewers.loading || typeof viewers() === 'string')} fallback={fallback}>
                <For each={viewers()}>
                    {(viewer) =>
                        <div>

                            <div class="flex items-center justify-center w-full mb-4">

                                <label class="flex items-center cursor-pointer">

                                    <div class="relative">

                                        <input type="checkbox" class="sr-only" checked={viewer.permitted}
                                               onclick={(el) => {
                                                   togglePermission(el, viewer.user);
                                               }}/>

                                        <div class="block bg-gray-600 w-14 h-8 rounded-full"></div>

                                        <div
                                            class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                                    </div>

                                    <div class="ml-3 text-default-700 font-medium">
                                        {viewer.user.username}
                                    </div>
                                </label>

                            </div>

                        </div>
                    }
                </For>
            </Show>
        </>
    );

}

export default ViewerAccess;