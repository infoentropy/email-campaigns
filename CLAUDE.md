# CLAUDE.md

This is a **private campaign repo**: email documents and audience definitions for the email tool in [`infoentropy/emails`](https://github.com/infoentropy/emails), which is expected to be cloned next to this repo as `../emails`. If it isn't there, clone it there. Run `git -C ../emails pull` before starting work, so the tool and its docs are current.

**Before touching anything, read `../emails/docs/agents.md`.** It's the guide for editing documents, settling audiences into facets, and converting audience markers for Iterable. Don't read the tool's specs unless you're changing the tool.

## Layout

- `campaigns/*.json`: one email document each. The person may have one open in the editor (file sync), so re-read a file before each change and write it in one go.
- `iterable/fields.md`: the Iterable user fields. A person writes it. Write facet conditions only from what it says, and ask when it doesn't say.
- `iterable/facets.json`: the approved facet library. Change it only with the person's explicit approval, following the settling procedure in `agents.md`.
- `out/`: built HTML (`<name>.html`, `<name>.iterable.html`, previews). It's tracked by git, so commit it with the document it was built from, and rebuild it after any change to that document. `out/index.html` links to every build; add a section for each new campaign.

## How the pieces fit

- A document is `{version, name, subject, preheader, theme, nextId, blocks[]}`. Blocks hold content only (styling comes from `theme`). Audience is per block: `ruleset` (free text while drafting, then facet ids joined with ` + `, e.g. `region.us-ca-gb + subscription.not-paying`), `switch` (adjacent blocks sharing a value; first matching case wins, a last case with no `ruleset` is the fallback) and `hidden`. New block id is `"b" + nextId`, then bump `nextId`; ids are never reused.
- `iterable/facets.json` is keyed `category → name` (facet id `category.name`). Each facet has `description`, `fields` (must be fields in `iterable/fields.md`), an Iterable `condition`, `approved` date and `examples`. When `fields.md` changes, re-check every facet whose `fields` include the changed field.
- `check.js` warns `ruleset_unsettled` for free-text rulesets; that's normal while drafting.
- Don't read rendered HTML to judge a change; rely on `check.js` and leave visual judgement to the person. `README.md` describes how to turn this example repo into a real private one.

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
- Whenever you add a file to `out/` (a build, an `.iterable.html` or a preview), update `out/index.html` in the same commit:
  - Each campaign has one section: `<h2>Campaign name <small>(file prefix)</small></h2>` followed by a `<ul>`. Copy the existing section for a new campaign.
  - Add one `<li>` per file, with a relative `href` (just the file name) and a short `<small>` note on what it is (e.g. "with audience markers", "paste into Iterable", "preview as `region.us`").
  - Keep the link text short and in this order: email HTML, Iterable HTML, previews.
  - When a file is renamed or deleted, fix or remove its link. Every link in the index must point to a file that exists.
  - Don't open the index to judge it; check the links with `grep -o 'href="[^"]*"' out/index.html`, and confirm each file exists.
