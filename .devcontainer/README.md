# Devcontainer

What the host hands this container, and how `gh` gets logged in inside it.

## Requirements

- Docker Compose **2.24 or later** — the optional `env_file` entries need it.
- A GitHub token scoped to this repository (optional, for `gh` inside the container): a
  fine-grained personal access token with only this repository selected and an expiry. The
  container never inherits the host's own `gh` login.

## How it works

`initializeCommand` runs `initialize.sh` **on the host** before every start. It writes
`.devcontainer/.host.env` (mode 600, gitignored, kept out of the image by `.dockerignore`) with
no credential in it, only:

| Variable                                                       | Source              |
| -------------------------------------------------------------- | ------------------- |
| `GITHUB_REPOSITORY`, `GITHUB_REPOSITORY_OWNER`, `GITHUB_ACTOR` | the `origin` remote |

It always exits 0, so a host without `git` still opens the container. Compose loads
`.host.env` and then `local.env`; both are optional, and a value in `local.env` wins.
Environment files are read when the container is **created**: after changing them, run
**Dev Containers: Rebuild Container**, not Reopen.

`gh` is not inherited. Once the container is running, log it in from the host, from this folder,
with the scoped token in `$TOKEN`:

```bash
printf '%s\n' "$TOKEN" | docker exec -i -u node \
  "$(docker ps -q --filter label=devcontainer.local_folder="$PWD")" \
  gh auth login -h github.com --with-token
```

The token goes through stdin, never an argument or an environment variable. A rebuild drops the
login; run it again. Check with `gh auth status` inside. If `gh` answers `Bad credentials`, or
403/404 on another repository, the token expired — or it is scoped to this repository, by
design; another repository gets its own token.

AI coding agents (Claude Code, Codex…) are not part of this devcontainer: nothing here installs
them, logs them in or keeps their state. Install and log in the one you use, from the host or
inside the container; its login and history persist only if its home is kept outside the
container layer. The editor extensions in `customizations` are only the editor side.

## Security

- The devcontainer's own files carry no credential. `.host.env` holds only the three `GITHUB_*`
  values; nothing in `devcontainer.json`, Compose or `local.env` holds a token.
- The token you log `gh` in with is the whole exposure. `gh` stores it in plain text in
  `~/.config/gh/hosts.yml`, since the container has no keyring, and every process in the container
  can read it — extensions, AI agents, package install scripts. Scoped to this one repository and
  with an expiry, a leak reaches this repository for a limited time and nothing else.
- Never pass it through the environment (`local.env` or Compose): an environment variable
  beats the stored login, shows up in `docker inspect`, and survives in the container's
  configuration.
- GitHub Projects owned by a user account are out of reach for fine-grained tokens. If you work
  a board from here, use a separate classic token with only `project`, `read:org` and
  `read:discussion` for it, never a wider one.
- On Windows, `initializeCommand` runs under `cmd.exe`; without Git for Windows' `sh` on the
  `PATH` no `.host.env` is written and the `GITHUB_*` values have to go in `local.env`. In
  Codespaces, Codespaces provides its own `GITHUB_TOKEN` and the login above is not needed.
