# frozen_string_literal: true

require 'nokogiri'
require 'yaml'
require 'date'
require 'time'

root = File.expand_path('..', __dir__)
output = File.expand_path(ARGV.fetch(0, '_site'))
errors = []
assert = ->(condition, message) { errors << message unless condition }
read_page = lambda do |path|
  file = File.join(output, path, 'index.html')
  assert.call(File.file?(file), "Missing page: #{path}")
  File.file?(file) ? Nokogiri::HTML(File.read(file)) : Nokogiri::HTML('')
end

projects = []
drafts = []
Dir[File.join(root, '_posts/*.md')].each do |file|
  metadata = YAML.safe_load(File.read(file).split('---', 3)[1], permitted_classes: [Date, Time])
  slug = File.basename(file, '.md')[11..]
  if metadata['published'] == false
    drafts << slug
    assert.call(!File.exist?(File.join(output, 'posts', slug, 'index.html')), "Draft published: #{slug}")
  elsif metadata['type'] == 'Projects'
    projects << slug
    page = read_page.call("posts/#{slug}")
    assert.call(page.at_css('.project-body'), "Project content missing: #{slug}")
    assert.call(page.at_css('h1')&.text == metadata['title'], "Project title changed: #{slug}")
    assert.call(page.at_css('.project-body')&.text&.strip&.length.to_i > 50, "Empty project: #{slug}")
  end
end

listing = read_page.call('My-Projects')
links = listing.css('.research-card-link').map { |node| node['href'].split('/posts/').last&.delete_suffix('/') }.sort
assert.call(links == projects.sort, 'Project listing does not contain every published project exactly once')
home = read_page.call('')
assert.call(home.css('.selected-research .research-card').length == 3, 'Homepage must have three featured projects')
assert.call(home.at_css('.hero-intro')&.text&.split&.length.to_i < 25, 'Homepage introduction is too long')
%w[Biography Publications Contact-Info Teams Sunshine about].each do |path|
  page = read_page.call(path)
  assert.call(page.at_css('.site-header') && page.at_css('.site-footer'), "Layout missing: #{path}")
end
about = read_page.call('about')
gallery_count = File.read(File.join(root, 'about.html')).scan('<figure>').length
assert.call(gallery_count >= 6 && about.css('.portfolio-gallery figure').length == gallery_count, 'Gallery images are missing')
assert.call(about.text.include?('I like to explore and create...'), 'Original introduction is missing')
publication_count = File.read(File.join(root, '_tabs/Publications.md')).lines.count { |line| line.start_with?('- ') }
assert.call(publication_count >= 5 && read_page.call('Publications').css('.page-content li').length == publication_count, 'Publications are missing')

Dir[File.join(output, '{index.html,about/index.html,Biography/index.html,Publications/index.html,Contact-Info/index.html,Teams/index.html,Sunshine/index.html,My-Projects/index.html,posts/*/index.html}')].each do |file|
  page = Nokogiri::HTML(File.read(file))
  assert.call(page.css('h1').length == 1, "Expected one main heading: #{file}")
  assert.call(!page.at_css('#sidebar'), "Old theme still present: #{file}")
  page.css('img').each do |image|
    assert.call(!image['src'].to_s.include?('design-concepts'), "Generated image used: #{file}")
    assert.call(!image['src'].to_s.include?('morphitcdn'), "External portfolio image used: #{file}")
    assert.call(!image['alt'].nil?, "Image alt missing: #{file}")
  end
end

abort errors.join("\n") unless errors.empty?
puts "Portfolio: #{projects.length} projects, #{drafts.length} retained drafts, #{publication_count} publications, #{gallery_count} gallery images; all checks passed."
