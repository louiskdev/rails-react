class AddClientIdToApiKey < ActiveRecord::Migration
  def up
    ApiKey.destroy_all
    add_column :api_keys, :client_id, :string, null: false
  end

  def down
    remove_column :api_keys, :client_id
  end
end
