import { createResource, createEffect, onCleanup } from "solid-js";
import { useService  } from "solid-services";
import { StatService } from "../store/StatService";
import { AuthService } from "../store/AuthService";

export function viewCounter(el, value) {
    const [viewcount, user] = value();

    const getViewCount = () => {
        let count = viewcount();
        return count == -404 ? 'Offline' : count == -500 ? '?' : count ;
    };

    createEffect( () => {
        let vc = getViewCount();
        document.title = (typeof vc === 'number' ? " 👁" + vc : " Offline") + " - "  + user;
    })
};
