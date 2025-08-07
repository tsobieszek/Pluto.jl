import { html, useState } from "../../imports/Preact.js"

export const Logout = () => {
    const [state, set_state] = useState({ loading: false, error: "" })
    const { loading, error } = state
    const set_error_loading = (error, loading) => set_state({ error, loading })

    // TODO: Add timeout handling
    const onClick = async (e) => {
        e.preventDefault()
        set_error_loading("", true)
        try {
            const resp = await fetch("/logout", { method: "POST", credentials: "same-origin" })
            if (resp.redirected) {
                 window.location.href = resp.url
             } else if(resp.ok) {
                 window.location.href = "/login"
             } else if (resp.status >= 400) {
                const txt = await resp.text()
                set_error_loading(txt || `Error: ${resp.statusText}`, false)
            } else {
                set_error_loading("An unexpected response was received from the server.", false)
            }
        } catch (err) {
            set_error_loading("A network error occurred. Please check your connection.", false)
        }
    }

    return html`
            ${error ? html`<p id="error" role="alert" aria-live="assertive">${error}</p>` : null}
            <button id="logout-button" onClick=${onClick} disabled=${loading} aria-busy=${loading}>
                ${loading ? "Logging out..." : "Logout"}
            </button>
    `
}
