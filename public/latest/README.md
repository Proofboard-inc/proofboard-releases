# Release artifacts

Every artifact from the current Proofboard CLI release, served directly at
`https://releases.proofboard.io/latest/<name>` rather than redirected to
GitHub. The install scripts fetch from these paths, so a download works even
when GitHub is unreachable.

These files are generated. Do not edit them by hand — they are replaced
wholesale on each release, and each one is verified against the release's own
`checksums.txt` before being committed. A pinned version (`/v1.16.3/<name>`)
still resolves through the GitHub redirect, as does any asset name not present
here.
