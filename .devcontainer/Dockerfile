FROM mcr.microsoft.com/devcontainers/javascript-node:24

# Ruby, Claude Code, GitHub CLI, etc. se instalan vía devcontainer features
# definidos en devcontainer.json. Aquí sólo las utilidades de búsqueda/edición
# que el flujo con agentes usa a diario.
RUN apt-get update && apt-get install -y --no-install-recommends \
    neovim \
    ripgrep \
    fd-find \
    && rm -rf /var/lib/apt/lists/*

# En Debian fd se llama fdfind; le damos el nombre que usa toda la documentación.
RUN ln -sf "$(which fdfind)" /usr/local/bin/fd
