---
title: "About"
permalink: /about/
description: "About The Greatest Shortcoming — the book, the author, and the works it builds on."
---

<header class="mb-12">
  <p class="kicker">About</p>
  <h1 class="mt-3 font-display text-5xl font-light leading-tight text-ink md:text-6xl">The Greatest Shortcoming</h1>
  <p class="mt-4 font-display text-2xl font-light italic text-mist">Quantitative Chauvinism and Lebensraum Imaginaries</p>
</header>

{% for item in site.coda %}
<section class="mt-12">
  <p class="kicker">{{ item.kicker }}</p>
  <h2 class="mt-2 font-display text-3xl font-light text-ink">{{ item.title }}</h2>
  {% if item.id == "author" %}
  <p class="mt-4">By <a href="https://www.brianckeegan.com">Brian C. Keegan</a>.</p>
  {% else %}
  <div class="mt-4">{{ item.body }}</div>
  {% endif %}
</section>
{% endfor %}
