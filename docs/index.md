---
hide:
  - navigation
---

# Deathblade Class Guide

<!-- Home page. Hand-edited, except the Difficulty and Trixion meters: build-stats-badge.js
fills each .home-meters from build-data.js (data-family and data-build name the build).
Typed by hand, not read from build-data.js: the Recommended and Not viable pills, the Ark Grid
need pills, the lane trade-off chips and every description. 333 Ceiling and 222 Speedy are also
recommended: true in build-data.js (compare-table star); the nav label and the skill-code tab
label carry the star by hand too.
Markup: wrappers are markdown="1" and link holders markdown="span", written flat with no
indentation (4 spaces is a code block) so mkdocs rewrites and checks the .md links. A paragraph
takes its class from an attr_list line directly under it (a blank line in between drops it).
Variants are attributes: data-accent on a lane, data-kind on a pill or row. Styles: the "Home
page" block in extra.css. -->

<div class="home" markdown="1">
<div class="home-lanes" markdown="1">
<section class="home-lane" data-accent="pink" markdown="1">
<header class="home-lane-head" markdown="1">
<div class="home-lane-top" markdown="1">

🌸 Remaining Energy
{ .home-lane-title role="heading" aria-level="2" }

[Get started →](remaining-energy/essentials.md){ .home-cta }

</div>

Build orbs, spend orbs, teleport.
{ .home-lane-line }

Punishing but rewarding gameplay.
{ .home-lane-sub }

- low <span class="skill-mention" data-glossary-id="backattack">back-attack</span> stress
- high uptime stress
- mana food required

</header>
<div class="home-rows" markdown="1">
<div class="home-row" data-kind="start" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span"><span class="home-row-emoji">🌱</span>[Standard](remaining-energy/standard.md){ .home-row-name }</div>

beginner • legacy
{ .home-row-words }

Simple to learn, with some downtime.
{ .home-row-desc }

</div>
<div class="home-row-side" markdown="1">

No Ark Grid
{ .home-pill data-kind="none" }

</div>
</div>
</div>

Then pick a build
{ .home-sec }

<div class="home-rows" markdown="1">
<div class="home-row" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span"><span class="home-row-emoji">✨</span>[333 <small>Ceiling</small>](remaining-energy/333-ceiling.md){ .home-row-name }<span class="home-pill" data-kind="star">★ Recommended</span></div>

meta • skill reset
{ .home-row-words }

Well-rounded build that offers the highest RE damage. Sensitive to high ping or low FPS.
{ .home-row-desc }

</div>
<div class="home-row-side" markdown="1">

Full Ark Grid
{ .home-pill data-kind="full" }

<div class="home-meters" data-family="re" data-build="333-ceiling"></div>
</div>
</div>
<div class="home-row" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span"><span class="home-row-emoji">💜</span>[313 <small>High Floor</small>](remaining-energy/313-high-floor.md){ .home-row-name }</div>

comfort • transitional
{ .home-row-words }

A faster, simpler, more forgiving build with a lower damage ceiling.
{ .home-row-desc }

</div>
<div class="home-row-side" markdown="1">

Some Ark Grid
{ .home-pill data-kind="little" }

<div class="home-meters" data-family="re" data-build="313-high-floor"></div>
</div>
</div>
<div class="home-row" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span"><span class="home-row-emoji">🔪</span>[111 <small>Head Hunt</small>](remaining-energy/111-head-hunt.md){ .home-row-name }</div>

challenging • old meta
{ .home-row-words }

Fast, punishing build with little recovery, but high skill expression.
{ .home-row-desc }

</div>
<div class="home-row-side" markdown="1">

Some Ark Grid
{ .home-pill data-kind="little" }

<div class="home-meters" data-family="re" data-build="111-head-hunt"></div>
</div>
</div>
</div>
</section>
<section class="home-lane" data-accent="teal" markdown="1">
<header class="home-lane-head" markdown="1">
<div class="home-lane-top" markdown="1">

⚡ Surge
{ .home-lane-title role="heading" aria-level="2" }

[Get started →](surge/essentials.md){ .home-cta }

</div>

Build stacks, chase back, execute.
{ .home-lane-line }

Nimble repositioning for one massive hit.
{ .home-lane-sub }

- highest mobility
- high CD gem investment
- stimulant recommended

</header>
<div class="home-rows" markdown="1">
<div class="home-row" data-kind="start" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span"><span class="home-row-emoji">🌱</span>[Surge](surge/pre-ark-grid.md){ .home-row-name }</div>

beginner • modern
{ .home-row-words }

Essentially 111 (Classic) with minor adjustments.
{ .home-row-desc }

</div>
<div class="home-row-side" markdown="1">

No Ark Grid
{ .home-pill data-kind="none" }

</div>
</div>
</div>

Then pick a spirit animal
{ .home-sec }

<div class="home-rows" markdown="1">
<div class="home-row" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span"><span class="home-row-emoji">🐆</span>[222 <small>Speedy</small>](surge/222-speedy.md){ .home-row-name }<span class="home-pill" data-kind="star">★ Recommended</span></div>

fast • acrobatic
{ .home-row-words }

Uptime-focused and mobile: easy to pick up, hard to master. It's exactly as good as you are.
{ .home-row-desc }

</div>
<div class="home-row-side" markdown="1">

Some Ark Grid
{ .home-pill data-kind="little" }

<div class="home-meters" data-family="surge" data-build="222-speedy"></div>
</div>
</div>
<div class="home-row" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span"><span class="home-row-emoji">🦁</span>[111 <small>Classic</small>](surge/111-classic.md){ .home-row-name }</div>

bursty • big hit
{ .home-row-words }

Builds up to one massive hit. Strongest burst combo, but it needs careful execution.
{ .home-row-desc }

</div>
<div class="home-row-side" markdown="1">

Some Ark Grid
{ .home-pill data-kind="little" }

<div class="home-meters" data-family="surge" data-build="111-classic"></div>
</div>
</div>
<div class="home-row" data-kind="variant" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span"><span class="home-row-emoji">🐯</span>[333 <small>Blitz</small>](surge/333-blitz.md){ .home-row-name }<span class="home-pill" data-kind="warn">Not viable</span></div>

tiger • skill reset
{ .home-row-words }

Fun, but too impractical for the damage it offers.
{ .home-row-desc }

</div>
<div class="home-row-side" markdown="1">

Full Ark Grid
{ .home-pill data-kind="full" }

<div class="home-meters" data-family="surge" data-build="333-blitz"></div>
</div>
</div>
</div>
</section>
</div>

<div class="home-res" markdown="1">
<div class="home-res-text" markdown="1">

📚 [Additional Resources](resources.md){ .home-res-link }
{ .home-res-title }

Shared by both playstyles: bonus skill codes, calculators and useful links.
{ .home-res-desc }

</div>

[Bonus Skill Codes](resources.md#bonus-skill-codes){ .home-chip } [Calculators](resources.md#ark-passive-calculator){ .home-chip } [Useful Links](resources.md#useful-links){ .home-chip }
{ .home-chips }

</div>

<div class="home-notes" markdown="1">
<div class="home-note" markdown="1">

Reading the names
{ .home-note-label }

**333, 313, 111, 222** are shorthand for each build's <span class="skill-mention" data-glossary-id="arkgrid">Ark Grid</span> Core assignment.

<span class="skill-mention" data-glossary-id="trixion">Trixion</span> DPS is the build's measured DPS multiplier against a dummy target.

</div>
<div class="home-note" markdown="1">

About
{ .home-note-label }

This site adapts KR Deathblade research for NA.

You can fork [the repo](https://github.com/interlockme/deathblade) to build a guide for this or another class.

</div>
</div>
</div>
