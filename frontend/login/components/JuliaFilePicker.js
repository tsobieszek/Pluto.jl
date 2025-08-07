import { html, useEffect, useState } from "../../imports/Preact.js"

export const JuliaFilePicker = ({ client, on_open_path }) => {
    const [entries, set_entries] = useState([])
    const [current_dir, set_current_dir] = useState("")
    const [loading, set_loading] = useState(true)

    useEffect(() => {
        if (client?.send) {
            set_loading(true)
            client
                .send("completepath", { query: current_dir }, {})
                .then((update) => {
                    const results = update.message.results
                    const directories = results.filter((result) => result.endsWith("/") || result.endsWith("\\")).sort()
                    const julia_files = results.filter((result) => result.endsWith(".jl")).sort()

                    const new_entries = [...directories, ...julia_files]

                    if (current_dir !== "") {
                        new_entries.unshift("..")
                    }

                    // @ts-ignore
                    set_entries(new_entries)
                    set_loading(false)
                })
                .catch(() => {
                    set_loading(false)
                })
        }
    }, [client, current_dir])

    if (loading) {
        return html`<p>Loading...</p>`
    }


    const parent_dir = (path) => {
        return path.replace(/[^\/\\]*[\/\\]$/, "")
    }

    return html`
        <ul class="julia-file-picker">
            ${entries.map((entry) => {
                // @ts-ignore
                const is_dir = entry.endsWith("/") || entry.endsWith("\\")
                const is_up = entry === ".."

                const handle_click = () => {
                    if (is_up) {
                        set_current_dir(parent_dir(current_dir))
                    } else if (is_dir) {
                        set_current_dir(current_dir + entry)
                    } else {
                        on_open_path(current_dir + entry)
                    }
                }

                const handle_keydown = (e) => {
                    if (e.key === "Enter") {
                        handle_click()
                    }
                }

                const entry_class = is_dir || is_up ? "julia-dir-entry" : "julia-file-entry"

                return html`<li
                    class=${entry_class}
                    onClick=${handle_click}
                    onKeyDown=${handle_keydown}
                    tabindex="0"
                    role="button"
                >
                    <span>${entry}</span>
                </li>`
            })}
        </ul>
    `
}
