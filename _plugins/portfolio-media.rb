# frozen_string_literal: true

# Render small local copies while retaining the original images in the repository.
# This filter is used only by the custom portfolio layout, never the slide exports.
module PortfolioMedia
  def portfolio_media(html)
    site = @context.registers[:site]
    html = html.gsub(/src="\/assets\/images\/([^"\/]+)"/) do
      filename = Regexp.last_match(1)
      preview = File.basename(filename, '.*') + '.webp'
      if File.file?(File.join(site.source, 'assets/images/previews', preview))
        %(src="/assets/images/previews/#{preview}")
      else
        Regexp.last_match(0)
      end
    end
    html = html.gsub(/<img\b[^>]*>/) do |tag|
      tag = tag.sub('<img', '<img loading="lazy"') unless tag.include?('loading=') || tag.include?('fetchpriority=')
      tag
    end
    prefix = site.baseurl.to_s
    unless prefix.empty?
      html = html.gsub(/((?:src|href)=")\/(assets\/images|posts)\//, '\\1' + prefix + '/\\2/')
    end
    html
  end
end

Liquid::Template.register_filter(PortfolioMedia)
