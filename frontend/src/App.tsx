import { useRoutes } from "solid-app-router";
import {Component, onMount} from "solid-js";
import Navbar from "./Navbar";
import Footer from "./Footer";

import { routes } from "./routes";
import {request} from "./webpush/web-push";
import {toast, Toaster} from "solid-toast";
import { ChatService } from "./store/ChatService";

const App: Component = () => {

    onMount(() => {
        request();
    })

  const Router = useRoutes(routes);
  return (
    <div class="flex flex-col h min-h-screen">
        <Toaster/>
        <Navbar/>
        <Router/>
        <div class="flex-grow"></div>
        <Footer/>
    </div>
  );
};

ChatService().connect()

export default App;
