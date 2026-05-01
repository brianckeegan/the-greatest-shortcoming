#!/usr/bin/env ruby
# bib_to_yaml.rb — convert bibliography.bib into _data/bibliography.yml
# for the Jekyll bibliography page. Run manually after editing the .bib:
#
#   ruby scripts/bib_to_yaml.rb
#
# This script is intentionally simple: pure Ruby stdlib, no gems, no Pages
# plugin. Handles the common BibTeX entry types in The Greatest Shortcoming's
# corpus (article, book, inproceedings, incollection, techreport, phdthesis,
# misc) and the common BibTeX value forms (braced, quoted, bare integer).
#
# It does NOT do full BibTeX parsing — no @string macros, no concatenation,
# no LaTeX-to-Unicode mapping beyond the most common cases. If your .bib uses
# advanced features, this will need extending.

require "yaml"
require "fileutils"

ROOT     = File.expand_path("..", __dir__)
SRC      = File.join(ROOT, "uploads", "bibliography.bib")
DEST     = File.join(ROOT, "_data", "bibliography.yml")
DEST_BIB = File.join(ROOT, "uploads", "bibliography.bib") # download target

unless File.exist?(SRC)
  warn "bib_to_yaml: #{SRC} not found. Copy bibliography.bib to uploads/ first."
  exit 1
end

raw = File.read(SRC)

# Strip BibTeX comments (% to end of line).
raw = raw.gsub(/^%.*$/, "")

# Split into entry chunks. Each entry begins with @type{key,
entries = []
raw.scan(/@(\w+)\s*\{([^,]+),(.*?)\n\}\s*(?=@|\z)/m) do |type, key, body|
  fields = {}
  # Extract field = value pairs. Value can be {…}, "…", or a bare integer.
  body.scan(/(\w+)\s*=\s*(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|\d+)\s*,?/m) do |fname, fval|
    val = fval.strip
    if val.start_with?("{") && val.end_with?("}")
      val = val[1..-2]
    elsif val.start_with?('"') && val.end_with?('"')
      val = val[1..-2]
    end
    # Light LaTeX-to-Unicode cleanup
    val = val.gsub(/\{\\&\}/, "&")
             .gsub(/\\&/, "&")
             .gsub(/\\textendash\{?\}?/, "–")
             .gsub(/\\textemdash\{?\}?/, "—")
             .gsub(/\\---/, "—")
             .gsub(/--/, "–")
             .gsub(/\{([^{}]*)\}/, "\\1") # strip protecting braces
             .gsub(/\s+/, " ")
             .strip
    fields[fname.downcase] = val
  end

  author_norm = (fields["author"] || fields["editor"] || "Unknown").strip
  surname     = author_norm.split(/\s+and\s+/).first.to_s.split(",").first.to_s.strip
  surname     = surname.split(/\s+/).last if surname.empty?
  sort_key    = (surname + " " + (fields["year"] || "0000")).downcase

  entries << {
    "key"       => key.strip,
    "type"      => type.downcase,
    "author"    => fields["author"] || fields["editor"] || "Unknown",
    "year"      => fields["year"],
    "title"     => fields["title"],
    "journal"   => fields["journal"] || fields["booktitle"] || fields["publisher"],
    "volume"    => fields["volume"],
    "number"    => fields["number"],
    "pages"     => fields["pages"],
    "publisher" => fields["publisher"],
    "address"   => fields["address"],
    "url"       => fields["url"] || fields["doi"],
    "sort_key"  => sort_key,
  }.compact
end

entries.sort_by! { |e| e["sort_key"].to_s }

FileUtils.mkdir_p(File.dirname(DEST))
File.write(DEST, entries.to_yaml)

puts "bib_to_yaml: wrote #{entries.size} entries → #{DEST.sub(ROOT + '/', '')}"
puts "bib_to_yaml: source bib already at #{DEST_BIB.sub(ROOT + '/', '')} (download link)"
