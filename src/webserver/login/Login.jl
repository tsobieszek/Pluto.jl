using HTTP
using Base64
using Logging


"""
Handles a POST request to /login. It authenticates the user and on success,
sets a session cookie and redirects. On failure, it returns an appropriate
error response.
"""
function handle_login(session::ServerSession, request::HTTP.Request)
    query = HTTP.queryparams(HTTP.URI(request.target))
    next_raw = get(query, "next", "/")
    next_sane = sanitize_next(next_raw)

    body = parse_login_body(request)
    username = get(body, "username", "")
    password = get(body, "password", "")

    if isempty(username) || isempty(password)
        return HTTP.Response(400, "Username and password are required.")
    end

    expected_password = get(USERS_PASSWORD, username, nothing)
    if expected_password !== nothing && expected_password == password
        @info "Login successful for user: $(username)"
        token = base64encode(rand(UInt8, 32))
        session.secret.tokens[token] = username

        response = HTTP.Response(302)
        HTTP.setheader(response, "Set-Cookie" => "$(SESSION_COOKIE)=$(token); SameSite=Strict; HttpOnly")
        HTTP.setheader(response, "Location" => next_sane)
        return response
    else
        @warn "Login failed for user: $(username)"
        return HTTP.Response(401, "Invalid username or password.")
    end
end

"""
Handles a POST request to /login. It logs out the user by deleting the session cookie
and redirecting to the login page.
"""
function handle_logout(session::ServerSession, request::HTTP.Request)
    token = nothing
    for c in HTTP.cookies(request)
        if c.name == SESSION_COOKIE
            token = c.value
            break
        end
    end
    if token !== nothing
        delete!(session.secret.tokens, token)
    end
    response = HTTP.Response(302)
    HTTP.setheader(response, "Set-Cookie" => "$(SESSION_COOKIE)=; Max-Age=0; SameSite=Strict; HttpOnly")
    HTTP.setheader(response, "Location" => "/login")
    return response
end

"""
Parses the request body for "username" and "password" fields.
"""
function parse_login_body(request::HTTP.Request)
    try
        # Handle URL-encoded form data
        body_string = String(request.body)
        parsed = HTTP.queryparams(body_string)
        username = get(parsed, "username", "")
        password = get(parsed, "password", "")
        return Dict("username" => username, "password" => password)
    catch e
        @error "Error parsing login form body." exception=(e, catch_backtrace())
        return Dict("username" => "", "password" => "")
    end
end
