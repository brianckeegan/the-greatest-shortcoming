---
title: "Table of contents"
kicker: "browse"
permalink: /contents/
description: "The eight drafted chapters of The Greatest Shortcoming, plus the preface."
---

<div class="not-prose grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {% for ch in site.data.chapters %}
    {% include chapter-card.html ch=ch %}
  {% endfor %}
</div>
