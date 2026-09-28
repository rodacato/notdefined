# Devcontainer

How the host's GitHub credentials reach this container.

## Requirements

- Docker Compose **2.24 or later** — the optional `env_file` entries need it.
- `gh` logged in on the host (optional). Without it, `gh` inside the container starts logged out
  after every rebuild.

## How it works

`initializeCommand` runs `initialize.sh` **on the host** before every start. It writes
`.devcontainer/.host.env` (mode 600, gitignored, kept out of the image by `.dockerignore`) with:

| Variable                                                       | Source                      |
| -------------------------------------------------------------- | --------------------------- |
| `GH_TOKEN`                                                     | `gh auth token` on the host |
| `GITHUB_REPOSITORY`, `GITHUB_REPOSITORY_OWNER`, `GITHUB_ACTOR` | the `origin` remote         |

It always exits 0, so a host without `gh` or `git` still opens the container. Compose loads
`.host.env` and then `local.env`; both are optional, and a value in `local.env` wins.

Environment files are read when the container is **created**: after logging in on the host, run
**Dev Containers: Rebuild Container**, not Reopen. Check with `gh auth status` inside.

## Security

- The token carries every scope of the host's `gh` login, and every process in the container can
  read it from the environment. That is no worse than `gh auth login` inside the container, which
  stores it in plain text too — but revoking it logs the host out as well.
- To narrow it, put a fine-grained token scoped to this repository in `.devcontainer/local.env` as
  `GH_TOKEN=…`. It overrides the inherited one.
