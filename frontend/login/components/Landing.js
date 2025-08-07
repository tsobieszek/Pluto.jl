import { html } from "../../imports/Preact.js"

import { Welcome } from "../../components/welcome/Welcome.js"
import { Logout } from "./Logout.js"
import { Sidebar } from "./Sidebar.js"

export const Landing = ({ launch_params }) => {

    return html`
    <div id="landing-page-container">
        <header id="logout-bar">
            <${Logout} />
        </header>
        <aside id="sidebar">
            <${Sidebar} launch_params=${launch_params}/>
        </aside>
        <main id="content">
        <${Welcome} launch_params=${launch_params} />
        </main>
    </div>
        `;
}
