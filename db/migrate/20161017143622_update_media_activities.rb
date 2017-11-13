class UpdateMediaActivities < ActiveRecord::Migration
  def up
    Activity.p_friends.where(name: 'galleries.create_media').update_all(privacy: Activity.privacies[:p_private])
  end

  def down
    # nothing
  end
end
