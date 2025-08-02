# Instead of String, the secret type is now determined by the authentication method.
# It is either TokenSecret (for login authentication) or String (for shared secret authentication).
"""
The `ServerSession` keeps track of:

- `connected_clients`: connected (web) clients
- `notebooks`: running notebooks
- `secret`: the web access token
- `options`: global pluto configuration `Options` for this session.
"""
mutable struct ServerSession{ST}
    connected_clients::Dict{Symbol,ClientSession}
    notebooks::Dict{UUID,Notebook}
    secret::ST
    binder_token::Union{String,Nothing}
    options::Configuration.Options
end


"""
This constructor determines the required secret type from the provided `options`
and initializes the ServerSession with the correct concrete type, allowing
`ServerSession()` and `ServerSession(; options)` to work as intended.
"""
function ServerSession(;
    connected_clients::Dict{Symbol,ClientSession} = Dict{Symbol,ClientSession}(),
    notebooks::Dict{UUID,Notebook} = Dict{UUID,Notebook}(),
    binder_token::Union{String,Nothing} = nothing,
    options::Configuration.Options = Configuration.Options(),
    secret = nothing
)
    ConcreteSecretType = SecretType(AuthenticationType(options))

    final_secret = if secret === nothing
        default_secret(ConcreteSecretType)
    else
        if !(secret isa ConcreteSecretType)
            error("Provided secret of type `$(typeof(secret))` does not match the expected type `$ConcreteSecretType` based on the session options.")
        end
        secret
    end

    return ServerSession{ConcreteSecretType}(
        connected_clients,
        notebooks,
        final_secret,
        binder_token,
        options
    )
end




const TokenString = String;  const UserString = String

struct TokenSecret
    tokens::Dict{TokenString,UserString}
end
TokenSecret() = TokenSecret(Dict{TokenString,UserString}())

# Prevent accidental 'spilling' of the TokenSecret's contents
Base.show(io::IO, ::TokenSecret) = print(io, "TokenSecret(...)")


default_secret(::Type{String}) = String(rand(('a':'z') ∪ ('A':'Z') ∪ ('0':'9'), 8))
default_secret(::Type{TokenSecret}) = TokenSecret()


const LoginSession = ServerSession{TokenSecret}
const SharedSecretSession = ServerSession{String}
