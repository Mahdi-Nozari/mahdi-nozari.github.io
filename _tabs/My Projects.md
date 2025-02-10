---
layout: page
icon: fa-solid fa-gears
order: 2
---

Here are my selected project. Please take a look...

<ul>
{% for post in site.posts %}
  {% if post.type == "Projects" %}
    <div class="post">
      <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
      <p class="post-meta">{{ post.date | date: "%B %d, %Y" }}</p>
      <div class="post-content" style="display: flex; align-items: center;">
        <div style="flex: 1;">
          <p>{{ post.description }}</p>
        </div>
        <div style="flex: 0 0 150px; margin-left: 10px;">
          <img src="{{ post.image }}" alt="{{ post.title }}" style="width: 100%;">
        </div>
      </div>
    </div>
    <hr>
  {% endif %}
{% endfor %}
</ul>