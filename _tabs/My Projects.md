---
layout: page
title: Research & projects
permalink: /My-Projects/
nav: research
order: 2
eyebrow: Design, build, test
description: Here are my selected projects. Please take a look.
wide: true
---
{% assign projects = site.posts | where: 'type', 'Projects' | sort: 'order' %}
<div class="project-toolbar">
  <div class="project-filters" role="group" aria-label="Filter projects by field" hidden>
    {% assign areas = 'All,Soft robotics,Biomedical systems,Control,Fabrication' | split: ',' %}
    {% for area in areas %}<button class="filter-button" type="button" data-filter="{{ area }}" aria-pressed="{% if forloop.first %}true{% else %}false{% endif %}">{{ area }}</button>{% endfor %}
  </div>
  <span class="project-count" role="status" aria-live="polite">{{ projects.size }} projects</span>
</div>
<div class="research-grid project-collection">
  {% for project in projects %}{% include project-card.html project=project details=true %}{% endfor %}
</div>
