require 'fileutils'

module GraphQL
  class DocGenerator

    def self.run
      doc_root_path = Rails.root.join('app', 'graph', 'docs').freeze
      FileUtils.rm_rf(doc_root_path) if Dir.exist?(doc_root_path)
      Dir.mkdir(doc_root_path)

      index_file = doc_root_path.join('index.html')
      File.open(index_file, 'w') do |file|
        file.write(%Q{<html><head></head><body>})
      end

      types_path = Rails.root.join('app', 'graph', 'types').freeze
      ignoring_files = %w( . .. query_type.rb mutation_type.rb )
      process_graphql_types(types_path, index_file, ignoring_files)

      File.open(index_file, 'a') { |file| file.write('</body></html>') }
      true
    end

    def self.process_graphql_types(dir, index_file, ignore_names=[], namespace='')
      Dir.foreach(dir) do |filename|
        next if ignore_names.include?(filename)
        nested_dir = "#{dir}/#{filename}"
        if Dir.exist?(nested_dir)
          process_graphql_types(nested_dir, index_file, ignore_names, "#{namespace}::#{filename.camelize}")
        elsif filename =~ /_type\.rb\z/
          name = filename.sub(/\.rb\z/, '')
          html = generate_graphql_type_html(name, namespace)
          File.open(index_file, 'a') { |file| file.write(html) }
        end
      end
    end

    def self.generate_graphql_type_html(name, namespace='')
      obj = "#{namespace.camelize}::#{name.camelize}".constantize
      interfaces_list = obj.interfaces.map {|i| "<li>#{i.name}</li>"}.join
      fields_list = obj.all_fields.map { |f| %Q{<li><span>#{f.name}</span>(#{f.type}): #{f.description}</li>} }.join
      html = <<-eos.squish
<div class='gql-type-container'>
<h2 class='gql-type-name'>#{obj.name}</h2>
<p class='gql-type-description'>#{obj.description}</p>
<p>Interfaces:</p>
<ul class='gql-interfaces-list'>
#{interfaces_list}
</ul>
<p>Fields:</p>
<ul class='gql-fields-list'>
#{fields_list}
</ul>
</div>
eos
      html
    end
  end
end