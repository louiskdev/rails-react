namespace :doc do
  desc "Generate GraphQL API documentation"
  task :graphql => :environment do
    require 'graphql/doc_generator'
    GraphQL::DocGenerator.run
  end
end