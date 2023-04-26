import { useRoutes } from "solid-app-router";
import {Component, createEffect, onMount} from "solid-js";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { routes } from "./routes";
import {request} from "./webpush/web-push";
import {Toaster} from "solid-toast";
import {useService} from "solid-services";
import {AuthService} from "./store/AuthService";
import {ChatService} from "./store/ChatService";

const App: Component = () => {

    const auth = useService(AuthService)
    const websocket = useService(ChatService)

    onMount(() => {
        request();
    })

    createEffect(() => {
        if (auth().user !== undefined) {
            websocket().reconnect()
        }
    });

  const Router = useRoutes(routes);
  return (
    <div class="flex flex-col h min-h-screen max-h-screen">
        <Toaster/>
        <Navbar/>
        <div class="flex flex-grow flex:row md:flex-col sm:flex-col">
            <Router/>
        </div>
        <Footer/>
    </div>
  );
};

export default App;
