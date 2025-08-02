# FIXME: Hardcoded user credentials
const USERS_PASSWORD = Dict(
    "user" => "password",
    "1" => "2",
)


abstract type Authentication end
struct LoginAuthentication <: Authentication end
struct SharedSecretAuthentication <: Authentication end

# Returns the Authentication type based on configuration
using Base: redir_out
AuthenticationType(options::Configuration.Options) =
    options.security.login_authentication ? LoginAuthentication() : SharedSecretAuthentication()

# Authentication type from ServerSession type
AuthenticationType(s::ServerSession) = AuthenticationType(typeof(s))
AuthenticationType(::Type{<:SharedSecretSession}) = SharedSecretAuthentication()
AuthenticationType(::Type{<:LoginSession}) = LoginAuthentication()


# Maps the Authentication type to the concrete Secret type
SecretType(::LoginAuthentication) = TokenSecret
SecretType(::SharedSecretAuthentication) = String


const SESSION_COOKIE = "_user_session_"
"""
Return whether the `request` was authenticated in the following way:
the cookie value is equal to the token of a user in the session.
"""
function is_authenticated(session::LoginSession, request::HTTP.Request)
    try
        cookies = HTTP.cookies(request)
        any(cookies) do cookie
            cookie.name == SESSION_COOKIE && haskey(session.secret.tokens, cookie.value)
        end
    catch e
        @warn "Failed to authenticate request using login cookie" exception = (e, catch_backtrace())
        false
    end
end


function auth_middleware(session::LoginSession, handler)
    return function (request::HTTP.Request)
        required = auth_required(session, request)

        if !required || is_authenticated(session, request)
            response = handler(request)
            if !required
                filter!(p -> p[1] != "Access-Control-Allow-Origin", response.headers)
                HTTP.setheader(response, "Access-Control-Allow-Origin" => "*")
            end
            response
        else
            next = request.target
            next_sane = sanitize_next(next) # it's not really needed here, it's important in `handle_login`
            location = "/login?next=$(HTTP.escapeuri(next_sane))"
            return redirect(location)
        end
    end
end

function sanitize_next(next::AbstractString)
    n = strip(next)
    isempty(n) && return "/"
    if startswith(lowercase(n), "http://") || startswith(lowercase(n), "https://")
        return "/"
    end
    if startswith(n, "/login")
        return "/"
    end
    startswith(n, "/") || return "/"
    return n
end
