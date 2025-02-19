import {Navigate, useSearchParams} from "solid-app-router";
import {Component, createMemo, createResource, createSignal, Show, Switch, Match, For} from "solid-js";
import { useService } from "solid-services";
import Layout from "./Layout";
import { AuthService } from "./store/AuthService";
import Title from "./Title";
import ViewerAccess from "./components/vieweraccess";
import Recordings from "./components/recordings";


const Dashboard: Component = () => {

  const authService = useService(AuthService);
  const [options, { refetch }] = createResource(() => {
    return authService().client.common.options();
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const [inputtype, setInputtype] = createSignal('password');

  const toggletype = () => inputtype() === 'password' ? setInputtype('text') : setInputtype('password');

  const reset = () =>
    authService().client.common.reset()
      .then(refetch);

  const visibleicon = (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );

  const visibleofficon = (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
      <path d="M0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0z" fill="none" />
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
    </svg>
  );

  const icon = createMemo(() => {
    return inputtype() === 'password' ? visibleicon : visibleofficon;
  });

  let input: HTMLInputElement;

  const copy = () => {
    navigator.clipboard.writeText(input.value);
  }

  function setEntry(page: string) {
    setSearchParams({subpage: page})
  }

  if (searchParams.subpage == undefined) {
    setEntry("token")
  }

  return (
    <>
      <Show when={authService().user != undefined && authService().user.id == 0}>
        <Navigate href="/login" state={{ redirectTo: '/dashboard' }} />
      </Show>
      <Title value="Dashboard" />
      <Layout>
        <div class="rounded-lg shadow bg-base-200 drawer drawer-mobile">
          <input id="my-drawer-2" type="checkbox" class="drawer-toggle"/>
          <div class="flex flex-col items-center justify-center drawer-content fix-content-height">
            <label for="my-drawer-2" class="mb-4 btn btn-primary drawer-button lg:hidden">open menu</label>
            <Show when={authService().user}>
              <Switch fallback={<div>Not Found</div>}>
                <Match when={searchParams.subpage === "token"}>
                  <div class="text-xs text-center">
                    <div class="form-control relative flex flex-row">
                      <input ref={input}
                             class="input font-mono box-content input-bordered bordered-r-none rounded-r-none w-[38ex]"
                             type={inputtype()} readOnly value={options()?.token || 'Create Token'}/>
                      <button type="button" onclick={toggletype}
                              class="top-0 rounded-none btn btn-primary">{icon()}</button>
                      <button type="button" onclick={copy} class="top-0 rounded-none btn btn-primary">Copy</button>
                      <button type="button" onclick={reset}
                              class="top-0 rounded-l-none btn btn-primary">{options() ? 'reset' : 'create'}</button>
                    </div>
                  </div>
                </Match>
                <Match when={searchParams.subpage === "access"}>
                  <ViewerAccess></ViewerAccess>
                </Match>

                <Match when={searchParams.subpage === "record"}>
                  <Show when={authService().token}>
                    <Recordings token={authService().token}></Recordings>
                  </Show>
                </Match>
              </Switch>
            </Show>
          </div>
          <div class="drawer-side">
            <label for="my-drawer-2" class="drawer-overlay"></label>
            <ul class="menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content">
              <li>
                <a classList={{ active: searchParams.subpage === "token" }} onclick={() => setEntry("token")}>
                  Stream Token
                </a>
              </li>
              <li>
                <a classList={{ active: searchParams.subpage === "access" }}  onclick={() => setEntry("access")}>
                  Access
                </a>
              </li>
              <li>
                <a classList={{ active: searchParams.subpage === "record" }}  onclick={() => setEntry("record")}>
                  Record
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Layout>
    </>
  );
}

export default Dashboard;
