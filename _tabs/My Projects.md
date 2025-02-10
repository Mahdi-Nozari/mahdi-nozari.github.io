---
layout: categories
icon: fa-solid fa-gears
order: 2
---

Here are my selected project. Please take a look...

<!-- <ul>
  <li>
    <a href="{{ site.baseurl }}/2025/02/10/BSc.html">Portable Medical Imaging Device</a>
    <p>A functional conceptual model for a medical imaging device intended for decreasing errors in delicate surgical operations and without the need to move the patient.</p>
  </li>
</ul> -->

<ul>
  {% for post in site.tags.Projects %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <p>{{ post.description }}</p>
    </li>
  {% endfor %}
</ul>