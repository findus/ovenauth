import "./index.css";
import { render } from "solid-js/web";
import { Router } from 'solid-app-router';

import App from "./App";
import { ServiceRegistry } from "solid-services";

declare module "solid-js" {
    namespace JSX {
      interface Directives {
        viewCounter: [String, number];
      }
    }
  }
  
render(
    () => (
        <ServiceRegistry>
            <Router>
                <App />
            </Router>
        </ServiceRegistry>
    ),
    document.getElementById("root")
);
