import { createEffect } from "solid-js";

createEffect(() => {
    if ('serviceWorker' in navigator) {
        console.log("load serviceworker")
        navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });
    }
});

const publicVapidKey = import.meta.env.VITE_WEB_PUSH_PUBKEY

if ('permissions' in navigator) {
    navigator.permissions.query({ name: 'notifications' }).then(function (notificationPerm) {
        notificationPerm.onchange = async function () {
            console.log("User decided to change his seettings. New permission: " + notificationPerm.state);
            if (notificationPerm.state == 'granted' ) {
                await subscribe();
            }
        };
    });
}

export async function request() {
    await Notification.requestPermission();
}

export async function subscribe() {

    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicVapidKey
    });


    const response = await fetch(import.meta.env.VITE_PROTOCOL + import.meta.env.VITE_BASEURL + '/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'content-type': 'application/json',
        },
    });

    if (response.ok) {

    }
}