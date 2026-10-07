---
layout: page
icon: fa-solid fa-gears
order: 2
---

Here are my selected projects. Please take a look.

<div class="project-list">
{% assign sorted_posts = site.posts | sort: 'order' %}
{% for post in sorted_posts %}
  {% if post.type == "Projects" %}
    <article class="project-card">
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <p class="post-meta">{{ post.date | date: "%B %d, %Y" }}</p>
      <div class="project-card-content">
        {% if post.description %}<p>{{ post.description }}</p>{% endif %}
        <img src="{% include media-url.html src=post.image %}" alt="{{ post.title }}">
      </div>
    </article>
  {% endif %}
{% endfor %}
</div>
