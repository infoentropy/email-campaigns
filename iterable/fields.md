# Iterable user fields

> **Example.** Replace every row with your own Iterable project's fields. Claude writes facet conditions only from what this file says, and asks rather than guessing, so it has to be accurate.

What a recipient's Iterable profile holds, as seen by templates at send time.

| Field | Type | Values | Notes |
|---|---|---|---|
| `country` | string | ISO 3166 code, upper case: `US`, `CA`, `GB`, … | From signup. Empty for some users. |
| `subscriptionStatus` | string | `paying`, `trial`, `lapsed`, `free` | Set by billing. Empty for users who never subscribed. |
| `plan` | string | `annual`, `monthly`, `lifetime` | Only set when `subscriptionStatus` is `paying`. |
| `playedSleepStory30d` | boolean | `true` / `false` | Precomputed nightly from play events. Iterable templates can't query event history themselves, so behaviour must arrive as a field like this, or as list membership. |

## How copy maps to fields

- "Subscriber" or "paying" means `subscriptionStatus` is `paying`. It never means a newsletter subscriber.
- "Not paying" includes empty `subscriptionStatus`.
- "UK" means `GB`.
- "Recently listened" means `playedSleepStory30d` is `true`.

## Gotchas

- Some Iterable helpers fail the send on an empty field. A condition on `country` or `subscriptionStatus` must behave sensibly when it's empty.

When this file changes, Claude re-checks every facet in `facets.json` whose `fields` include the changed field.
