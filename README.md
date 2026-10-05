# email-campaigns

A public, **example** campaign repo for the [`infoentropy/emails`](https://github.com/infoentropy/emails) email tool. It shows the layout a real campaign repo has: email documents, Iterable fields, approved audience facets. Everything here is made-up sample data and contains no Iterable keys.

**Use it for your own campaigns:** don't fork it (forks of a public repo stay public). Make a new **private** repo from it. The quickest way:

```sh
mkdir work && cd work
git clone https://github.com/infoentropy/emails
git clone https://github.com/infoentropy/email-campaigns my-campaigns
cd my-campaigns
rm -rf .git && git init -b main                      # detach from this example
gh repo create my-campaigns --private --source=. --push   # or create the repo on GitHub and add it as origin
```

Then follow "Set up" from step 4 below (rewrite `iterable/fields.md`, trim `iterable/facets.json`). Open Claude Code in `my-campaigns`; its `CLAUDE.md` points at `../emails`.

The rest of this file is the tool's campaign-repo guide.

---

A starting point for the **private** repo that holds your campaigns: the email documents, your Iterable fields, and the approved audience facets. The tool (editor, render layer, docs) stays in the public repo, [`infoentropy/emails`](https://github.com/infoentropy/emails). Keep content out of it: that repo is public and published on GitHub Pages.

## Set up

1. **Create a private repo**, e.g. `email-campaigns`.
2. **Copy this folder's contents** into it: `campaigns/`, `iterable/`, `CLAUDE.md`, `.gitignore` and this README.
3. **Clone both side by side.** The commands and `CLAUDE.md` assume this layout:
   ```
   work/
     emails/            git clone https://github.com/infoentropy/emails
     email-campaigns/   your private repo
   ```
4. **Rewrite `iterable/fields.md`** for your Iterable project: the user fields that exist, and how their values are coded. The example rows are made up. Everything about audiences depends on this file being right.
5. **Empty or trim `iterable/facets.json`.** The example facets use the example fields. Facets get added as you settle audiences with Claude.
6. Delete `campaigns/2026-10-sleep-stories.json` once you've tried it, or keep it as a reference.

Never commit an Iterable API key. Keep it in your environment (e.g. `ITERABLE_API_KEY`).

## Try the example

From the campaign repo:

```sh
node ../emails/render/check.js campaigns/2026-10-sleep-stories.json          # [] = no problems
node ../emails/render/email.js campaigns/2026-10-sleep-stories.json > out/sleep-stories.html
```

In Chrome or Edge, open the editor at <https://infoentropy.github.io/emails/authoring/> and use **Open file** on `campaigns/2026-10-sleep-stories.json`. The editor stays attached to the file: your edits save to it, and edits Claude makes to it show up within a couple of seconds. Use **Preview as** to see what each audience gets.

## Making an email

1. **Draft.** Ask Claude to turn the copy into a document in `campaigns/`, or build it in the editor. Audiences start as free text in each block's `ruleset` ("US/Canada/UK folks who haven't paid").
2. **Review and tweak** in the editor: the live preview, the themes, and Preview as.
3. **Settle audiences with Claude.** It matches each free-text ruleset to facets in `iterable/facets.json` by meaning, asks you to confirm, and proposes new facets (from `fields.md`) only when none fit. Nothing is settled or approved without you.
4. **Build for Iterable.** Claude runs `email.js`, which gives plain HTML with `<!--audience …-->` markers, and converts the markers into Iterable Handlebars from the approved facets. The result goes in `out/iterable/<campaign>.html`.
5. **Send to Iterable and proof.** Paste the file into Iterable's template editor and send proofs to test users. Pushing through Iterable's API is planned but not set up yet.

The procedures Claude follows for steps 3 and 4 are in [`docs/agents.md`](https://github.com/infoentropy/emails/blob/master/docs/agents.md) in the tool repo.
