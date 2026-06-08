source "https://rubygems.org"

# Standalone Jekyll (not the github-pages gem). The site deploys via GitHub
# Actions, so GitHub Pages "gem parity" isn't needed — and dropping the
# github-pages gem lets the build run on Ruby 4. (The github-pages gem pins
# native deps like commonmarker 0.17.x that will not compile on Ruby 4.)
gem "jekyll", "~> 4.4"

# Required for Ruby 3.0+ which removed webrick from the stdlib
gem "webrick", "~> 1.8"

# Unbundled from Ruby's default gems in 3.4/4.0; declare explicitly for Ruby 4.
# (Pure-Ruby, no native build. Jekyll 4.4 also lists these, but be explicit.)
gem "csv"
gem "base64"

group :jekyll_plugins do
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end
