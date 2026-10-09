---
hide:
  - navigation
---

# Deathblade Class Guide

<!-- Home page. Hand-edited, except each build row: build-stats-badge.js fills a
.home-row (data-family and data-build name the build) with its emoji, descriptor line,
description, Ark Grid pill, recommended or not viable flag and the Difficulty and Trixion
meters, all read from build-data.js, the same fields the compare rows on the essentials
pages show. Edit a build's pitch there, not here. Typed by hand here: the build name link
(a real markdown link, so mkdocs rewrites and checks it; check_content.py compares the
text to the name in build-data.js), the lane trade-off chips and the notes.
Markup: wrappers are markdown="1" and link holders markdown="span", written flat with no
indentation (4 spaces is a code block) so mkdocs rewrites and checks the .md links. A paragraph
takes its class from an attr_list line directly under it (a blank line in between drops it).
Variants are attributes: data-accent on a lane, data-kind="start" on a row. Styles: the "Home
page" block in extra.css. -->

<div class="home" markdown="1">
<div class="home-lanes" markdown="1">
<section class="home-lane" data-accent="pink" markdown="1">
<header class="home-lane-head" markdown="1">
<div class="home-lane-top" markdown="1">

🌸 Remaining Energy
{ .home-lane-title role="heading" aria-level="2" }

[Start with essentials →](remaining-energy/essentials.md){ .home-cta }

</div>

Build orbs, spend orbs, teleport.
{ .home-lane-line }

- low <span class="skill-mention" data-glossary-id="backattack">back-attack</span> stress
- high uptime stress
- mana food required

</header>
<div class="home-rows" markdown="1">
<div class="home-row" data-kind="start" data-family="re" data-build="standard" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span">[Standard](remaining-energy/standard.md){ .home-row-name }</div>

</div>
<div class="home-row-side" markdown="1">

</div>
</div>
</div>

Then pick a build
{ .home-sec }

<div class="home-rows" markdown="1">
<div class="home-row" data-family="re" data-build="333-ceiling" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span">[333 <small>Ceiling</small>](remaining-energy/333-ceiling.md){ .home-row-name }</div>

</div>
<div class="home-row-side" markdown="1">

<div class="home-meters"></div>
</div>
</div>
<div class="home-row" data-family="re" data-build="313-high-floor" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span">[313 <small>High Floor</small>](remaining-energy/313-high-floor.md){ .home-row-name }</div>

</div>
<div class="home-row-side" markdown="1">

<div class="home-meters"></div>
</div>
</div>
<div class="home-row" data-family="re" data-build="111-head-hunt" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span">[111 <small>Head Hunt</small>](remaining-energy/111-head-hunt.md){ .home-row-name }</div>

</div>
<div class="home-row-side" markdown="1">

<div class="home-meters"></div>
</div>
</div>
</div>
</section>
<section class="home-lane" data-accent="teal" markdown="1">
<header class="home-lane-head" markdown="1">
<div class="home-lane-top" markdown="1">

⚡ Surge
{ .home-lane-title role="heading" aria-level="2" }

[Start with essentials →](surge/essentials.md){ .home-cta }

</div>

Build stacks, chase back, execute.
{ .home-lane-line }

- highest mobility
- high CD gem investment
- stimulant recommended

</header>
<div class="home-rows" markdown="1">
<div class="home-row" data-kind="start" data-family="surge" data-build="pre-ark-grid" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span">[Surge](surge/111-classic.md){ .home-row-name }</div>

</div>
<div class="home-row-side" markdown="1">

</div>
</div>
</div>

Then pick a spirit animal
{ .home-sec }

<div class="home-rows" markdown="1">
<div class="home-row" data-family="surge" data-build="111-classic" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span">[111 <small>Classic</small>](surge/111-classic.md){ .home-row-name }</div>

</div>
<div class="home-row-side" markdown="1">

<div class="home-meters"></div>
</div>
</div>
<div class="home-row" data-family="surge" data-build="222-speedy" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span">[222 <small>Speedy</small>](surge/222-speedy.md){ .home-row-name }</div>

</div>
<div class="home-row-side" markdown="1">

<div class="home-meters"></div>
</div>
</div>
<div class="home-row" data-family="surge" data-build="333-blitz" markdown="1">
<div class="home-row-main" markdown="1">
<div class="home-row-head" markdown="span">[333 <small>Blitz</small>](surge/333-blitz.md){ .home-row-name }</div>

</div>
<div class="home-row-side" markdown="1">

<div class="home-meters"></div>
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
