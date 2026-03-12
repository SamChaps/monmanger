---
layout: null
---

var store = [
{%- assign searchable_docs = "" | split: "" -%}
{%- for collection in site.collections -%}
  {%- assign docs = collection.docs | where_exp: "doc", "doc.search != false" -%}
  {%- assign searchable_docs = searchable_docs | concat: docs -%}
{%- endfor -%}
{%- assign searchable_pages = site.html_pages | where_exp: "doc", "doc.search != false" | where_exp: "doc", "doc.title" | where_exp: "doc", "doc.layout != 'search'" -%}
{%- assign everything = searchable_docs | concat: searchable_pages -%}
{%- for doc in everything -%}
  {%- if doc.header.teaser -%}
    {%- capture teaser -%}{{ doc.header.teaser }}{%- endcapture -%}
  {%- else -%}
    {%- assign teaser = site.teaser -%}
  {%- endif -%}
  {
    "title": {{ doc.title | jsonify }},
    "title_fr": {{ doc.title_fr | default: doc.title | jsonify }},
    "excerpt":
      {%- if site.search_full_content == true -%}
        {{ doc.content | newlines_to_br | replace: "<br />", " " | strip_html | strip_newlines | jsonify }},
      {%- else -%}
        {{ doc.content | newlines_to_br | replace: "<br />", " " | strip_html | truncatewords: 50 | strip_newlines | jsonify }},
      {%- endif -%}
    "excerpt_fr": {{ doc.excerpt_fr | default: "" | jsonify }},
    "categories": {{ doc.categories | jsonify }},
    "tags": {{ doc.tags | jsonify }},
    "tags_fr": [{% for tag in doc.tags %}{% assign td = site.data.tags | where: "name", tag | first %}{{ td.name_fr | default: tag | jsonify }}{% unless forloop.last %},{% endunless %}{% endfor %}],
    "url": {{ doc.url | relative_url | jsonify }},
    "teaser": {{ teaser | jsonify }}
  }{%- unless forloop.last -%},{%- endunless -%}
{%- endfor -%}
]
