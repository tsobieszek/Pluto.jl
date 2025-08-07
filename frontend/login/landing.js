import { html, render } from "../imports/Preact.js"
import "../common/NodejsCompatibilityPolyfill.js"
import { Landing } from "./components/Landing.js"

// I'm ignoring launch_params (the defaults will be used, but we can copy the lines from `index.js`)


// @ts-ignore
render(html`<${Landing} launch_params=${{}} />`, document.querySelector("#app"))
