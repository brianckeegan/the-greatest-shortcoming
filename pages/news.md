---
title: "News"
kicker: "talks, reviews, events"
permalink: /news/
description: "News and updates about The Greatest Shortcoming."
---

<p class="aside">
  Talks, reviews, releases, and book-related events. To add an entry, append
  to <code>_data/news.yml</code>.
</p>

{% assign sorted = site.data.news | sort: 'date' | reverse %}
{% if sorted.size == 0 %}
  <p>No news yet — check back soon.</p>
{% else %}
  <div class="news-list" style="grid-template-columns: 1fr; max-width: 60ch;">
    {% for item in sorted %}
      {% if item.link %}
        <a class="news-item" href="{{ item.link | relative_url }}">
          <p class="kicker">{{ item.date }}{% if item.kind %} · {{ item.kind }}{% endif %}</p>
          <h2 style="font-style: italic; margin: 4px 0 6px;">{{ item.title }}</h2>
          {% if item.blurb %}<p style="margin: 0; color: var(--ink-soft);">{{ item.blurb }}</p>{% endif %}
        </a>
      {% else %}
        <article class="news-item">
          <p class="kicker">{{ item.date }}{% if item.kind %} · {{ item.kind }}{% endif %}</p>
          <h2 style="font-style: italic; margin: 4px 0 6px;">{{ item.title }}</h2>
          {% if item.blurb %}<p style="margin: 0; color: var(--ink-soft);">{{ item.blurb }}</p>{% endif %}
        </article>
      {% endif %}
    {% endfor %}
  </div>
{% endif %}
