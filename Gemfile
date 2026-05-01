source "https://rubygems.org"

# Use the github-pages gem so this builds on GitHub Pages exactly as it builds locally.
# Pinning to github-pages keeps Jekyll, plugins, and Ruby versions in sync with GH Pages.
gem "github-pages", group: :jekyll_plugins

# Required for Ruby 3.0+ which removed webrick from the stdlib
gem "webrick", "~> 1.8"

group :jekyll_plugins do
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end
