import { createEffect, createSignal } from "solid-js";

const setThemeDom = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
};

export const [theme, setTheme] = createSignal(localStorage.getItem('theme') || 'forest');

createEffect(() => {
    var themev = theme();
    const resetOnce = localStorage.getItem("styleResetted")
    if (resetOnce == undefined) {
        localStorage.setItem("styleResetted", "x")
        themev = 'forest'
    }
    setThemeDom(themev);
    localStorage.setItem('theme', themev);
});
