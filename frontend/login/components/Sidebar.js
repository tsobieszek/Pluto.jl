import { guess_notebook_location } from "../../common/NotebookLocationFromURL.js"
import { create_pluto_connection, ws_address_from_base } from "../../common/PlutoConnection.js"
import { link_open_path, link_open_url } from "../../components/welcome/Open.js"
import { html, useEffect, useState } from "../../imports/Preact.js"
import { JuliaFilePicker } from "./JuliaFilePicker.js"

export const Sidebar = ({ launch_params }) => {
    const [client, set_client] = useState(null)

    useEffect(() => {
        const client_promise = create_pluto_connection({
            on_unrequested_update: () => true,
            on_connection_status: () => {},
            on_reconnect: async () => true,
            ws_address: launch_params.pluto_server_url ? ws_address_from_base(launch_params.pluto_server_url) : undefined,
        })
        client_promise.then(async (client) => {
            // @ts-ignore
            set_client(client)
            client.send("completepath", { query: "" }, {})
        })
    }, [launch_params.pluto_server_url])


    const on_open_path = async (new_path) => {
        const processed = await guess_notebook_location(new_path)
        window.location.href = (processed.type === "path" ? link_open_path : link_open_url)(processed.path_or_url)
    }

    return html`
                <div class="julia-file-picker-container">
                    <h2>Julia Files</h2>
                    <${JuliaFilePicker}
                        client=${client}
                        on_open_path=${on_open_path}
                    />
                </div>
`
}