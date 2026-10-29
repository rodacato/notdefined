# Security policy

## Reporting a vulnerability

Report it privately through
[GitHub private vulnerability reporting](https://github.com/rodacato/notdefined/security/advisories/new).
Please do not open a public issue or pull request for it.

Expect a first reply within a week. Once a fix ships, the advisory is published with credit, unless you
prefer otherwise.

## Scope

The source in this repository and the site it builds, [notdefined.dev](https://notdefined.dev). Only
`master` is supported: the site is rebuilt from it on every push, so there are no older releases to patch.

Out of scope: the third-party services the site links to or embeds, and the interactive guides under
`public/guias/`, which are self-contained exported artifacts. Report those to their own authors.
