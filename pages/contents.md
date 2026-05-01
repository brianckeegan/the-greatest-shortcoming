---
title: "Table of contents"
kicker: "browse"
permalink: /contents/
description: "The eight drafted chapters of The Greatest Shortcoming, plus the preface."
---

<div class="toc">
  <div class="toc__cards">
    {% for ch in site.data.chapters %}
      {% include chapter-card.html ch=ch %}
    {% endfor %}
  </div>
</div>
