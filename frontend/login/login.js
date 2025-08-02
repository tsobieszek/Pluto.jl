import { html, render, useState } from "../imports/Preact.js";

export const LoginForm = () => {
    const nextPath = new URLSearchParams(window.location.search).get("next") || "/";

    const [state, set_state] = useState({ loading: false, error: "" });
    const { loading, error } = state;
    const set_error_loading = (error, loading) => set_state({ error, loading });
    const [user, set_user] = useState("");
    const [pass, set_pass] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        set_error_loading("", true);

        if (!user && !pass) return set_error_loading("Please enter both username and password.", false);
        if (!user) return set_error_loading("Please enter your username.", false);
        if (!pass) return set_error_loading("Please enter your password.", false);

        // TODO: Add timeout handling
        try {
            const resp = await fetch(`/login?next=${encodeURIComponent(nextPath)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    Accept: "text/plain, application/json",
                },
                body: new URLSearchParams({ username: user, password: pass }).toString()
            });
            if (resp.redirected) {
                 window.location.href = resp.url
             } else if(resp.ok) {
                 window.location.href = "/login"
             } else if (resp.status >= 400) {
                const txt = await resp.text();
                set_error_loading(txt || `Error: ${resp.statusText}`, false);
            } else {
                set_error_loading("An unexpected response was received from the server.", false);
            }
        } catch (err) {
            console.error("Login fetch error:", err);
            set_error_loading("A network error occurred. Please check your connection.", false);
        }
    };


    return html`
        <form id="login-form" onSubmit=${handleSubmit} novalidate>
            <label for="username">Username</label>
            <input
                id="username"
                type="text"
                name="username"
                autocomplete="username"
                required
                value=${user}
                onInput=${(e) => set_user(e.target.value)}
            />

            <label for="password">Password</label>
            <input
                id="password"
                type="password"
                name="password"
                autocomplete="current-password"
                required
                value=${pass}
                onInput=${(e) => set_pass(e.target.value)}
            />

            <button type="submit" disabled=${loading} aria-busy=${loading}>
                ${loading ? "Logging in..." : "Login"}
            </button>

            ${error ? html`<p id="error" role="alert" aria-live="assertive">${error}</p>` : null}
        </form>
    `;
};

// @ts-ignore
render(html`<${LoginForm} />`, document.querySelector("#login-card"));
