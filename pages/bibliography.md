---
title: "Bibliography"
kicker: "sources"
permalink: /bibliography/
description: "Working bibliography for The Greatest Shortcoming, with full BibTeX download."
---

<p class="aside">
  This is the working bibliography for the manuscript. Entries are auto-generated
  from <code>bibliography.bib</code> by a one-shot Ruby script
  (<code>scripts/bib_to_yaml.rb</code>) into <code>_data/bibliography.yml</code>.
  Run the script after updating the BibTeX file. The raw BibTeX is also
  available for download.
</p>

<p>
  <a class="action-card" style="display:inline-block;" href="{{ '/uploads/bibliography.bib' | relative_url }}" download>
    <span class="action-card__kicker">download</span>
    <span class="action-card__title">bibliography.bib</span>
  </a>
</p>

{% if site.data.bibliography %}
<div class="bib-filter">
  <label for="bib-filter-input" class="kicker">filter</label>
  <input id="bib-filter-input" type="search" placeholder="surname, title, year…" autocomplete="off" />
</div>

<ol class="bib-list" id="bib-list">
  {% assign sorted = site.data.bibliography | sort: "sort_key" %}
  {% for e in sorted %}
    <li class="bib-entry"
        data-haystack="{{ e.author | downcase }} {{ e.title | downcase }} {{ e.year }} {{ e.journal | default: '' | downcase }}">
      <span class="bib-entry__author">{{ e.author }}</span>
      {% if e.year %}<span class="bib-entry__year"> ({{ e.year }})</span>{% endif %}.
      <span class="bib-entry__title">{{ e.title }}</span>{% if e.journal %},
        <span class="bib-entry__venue">{{ e.journal }}</span>{% endif %}{% if e.volume %} <b>{{ e.volume }}</b>{% endif %}{% if e.number %}({{ e.number }}){% endif %}{% if e.pages %}: {{ e.pages }}{% endif %}.
    </li>
  {% endfor %}
</ol>

<script>
  (function () {
    var input = document.getElementById('bib-filter-input');
    var list = document.getElementById('bib-list');
    if (!input || !list) return;
    var entries = list.querySelectorAll('.bib-entry');
    input.addEventListener('input', function () {
      var q = this.value.trim().toLowerCase();
      entries.forEach(function (li) {
        if (!q || li.dataset.haystack.indexOf(q) !== -1) {
          li.style.display = '';
        } else {
          li.style.display = 'none';
        }
      });
    });
  })();
</script>
{% else %}
<p class="aside">
  Bibliography data is not yet generated. To populate this page, run
  <code>ruby scripts/bib_to_yaml.rb</code> from the repository root after
  placing <code>bibliography.bib</code> in <code>uploads/</code>.
</p>
{% endif %}
