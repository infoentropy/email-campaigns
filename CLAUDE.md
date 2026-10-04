# CLAUDE.md

This is a **private campaign repo**: email documents and audience definitions for the email tool in [`infoentropy/emails`](https://github.com/infoentropy/emails), which is expected to be cloned next to this repo as `../emails`. If it isn't there, clone it there. Run `git -C ../emails pull` before starting work, so the tool and its docs are current.

**Before touching anything, read `../emails/docs/agents.md`.** It's the guide for editing documents, settling audiences into facets, and converting audience markers for Iterable. Don't read the tool's specs unless you're changing the tool.

## Layout

- `campaigns/*.json`: one email document each. The person may have one open in the editor (file sync), so re-read a file before each change and write it in one go.
- `iterable/fields.md`: the Iterable user fields. A person writes it. Write facet conditions only from what it says, and ask when it doesn't say.
- `iterable/facets.json`: the approved facet library. Change it only with the person's explicit approval, following the settling procedure in `agents.md`.
- `out/`: built HTML. It's git-ignored; never commit it.

## Commands

```sh
node ../emails/render/check.js campaigns/<file>.json                  # issues as JSON; [] = good
node ../emails/render/email.js campaigns/<file>.json > out/<name>.html  # HTML for sending, with audience markers
node ../emails/render/preview.js campaigns/<file>.json --as <facet> > out/<name>.preview.html   # milestones only
```

## Rules

- Never commit secrets. An Iterable API key, if one is used, comes from the environment (e.g. `ITERABLE_API_KEY`).
- Never settle a ruleset, add a facet or approve one without the person.
- Iterable syntax is written only when converting markers into `out/<name>.iterable.html`, never into documents.
- Pushing to Iterable through its API isn't set up yet. Hand the person the `out/…iterable.html` file to paste into Iterable, and say which facets it uses.
