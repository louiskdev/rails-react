class Like < Socialization::ActiveRecordStores::Like

  # TODO: this is a HACK (bug in gem 'socialization')
  before_save :fix_namespaced_model

  # TODO method is overridden!
  # Returns an ActiveRecord::Relation of all the likers of a certain type that are liking  likeable
  def self.likers_relation(likeable, klass, opts = {})
    likeable_type = likeable.class.name == 'Widgets::BlogWidget::Post' ? 'BlogWidgetPost' : likeable.class.name # TODO: a part of HACK

    rel = klass.where(:id =>
                          self.select(:liker_id).
                              where(:liker_type => klass.table_name.classify).
                              where(:likeable_type => likeable_type).
                              where(:likeable_id => likeable.id)
    )

    if opts[:pluck]
      rel.pluck(opts[:pluck])
    else
      rel
    end
  end

  private

  def fix_namespaced_model
    self.likeable_type = case likeable_type
                           when 'Widgets::BlogWidget::Post' then 'BlogWidgetPost'
                           else
                             self.likeable_type
                         end
  end
end
