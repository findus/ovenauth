import { NavLink, useNavigate } from "solid-app-router";
import { Component, Switch, Match, createSignal } from "solid-js";
import { useService } from "solid-services";
import { AuthService } from "./store/AuthService";


const Navbar: Component = () => {

    const navigate = useNavigate();

    const authService = useService(AuthService);

    const logout = async () => {
        await authService().logout();
    };

    return (
        <nav class="flex items-center justify-between flex-wrap  bg-neutral text-neutral-content p-6">
            <div class="flex-none px-2 mx-2" onclick={ () => navigate("/", { replace: true })}
                 onTouchEnd={ () => navigate("/", { replace: true }) } >
                <span class="text-lg font-bold">
                {import.meta.env.VITE_PAGE_TITLE}
                </span>
            </div>
            <div class="flex-1 px-2 mx-2">
                <div class="items-stretch hidden lg:flex">
                    <NavLink activeClass="btn-active" end href="/" class="btn btn-ghost btn-sm rounded-btn">
                        Home
                    </NavLink>
                </div>
            </div>
            <Switch>
                <Match when={authService().user}>
                    <div class="flex-none">
                        <div class="items-strech hidden lg:flex">
                            <NavLink activeClass="btn-active" href="/dashboard" class="btn btn-ghost btn-sm rounded-btn">
                                {authService().user.username}
                            </NavLink>
                        </div>
                    </div>
                    <div class="flex-none">
                        <div class="items-strech hidden lg:flex">
                            <button onClick={logout} class="btn btn-ghost btn-sm rounded-btn">
                                Logout
                            </button>
                        </div>
                    </div>
                </Match>
                <Match when={!authService().user}>
                    <div class="flex-none">
                        <div class="items-strech hidden lg:flex">
                            <NavLink activeClass="btn-active" href="/login" class="btn btn-ghost btn-sm rounded-btn">
                                Login
                            </NavLink>
                        </div>
                    </div>
                    <div class="flex-none">
                        <div class="items-strech hidden lg:flex">
                            <NavLink activeClass="btn-active" href="/register" class="btn btn-ghost btn-sm rounded-btn">
                                Register
                            </NavLink>
                        </div>
                    </div>
                </Match>
            </Switch>

        </nav>
    )
}

export default Navbar;
