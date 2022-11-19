import {toast} from "solid-toast";
import {createEffect, createSignal, onCleanup} from "solid-js";

const duration  = 6000

export function showNotification(title: string, body: string) {
    toast.success(title + ":\n " + body);
}