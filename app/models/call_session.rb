require "opentok"

class CallSession < ActiveRecord::Base

  def self.request_direct_call(initiator_id, receiver_id)
    session = CallSession.where(initiator_id: initiator_id, receiver_id: receiver_id).first
    if session.present?
      session
    else
      api_key = ENV['OPENTOK_API_KEY']
      api_secret = ENV['OPENTOK_API_SECRET']
      opentok = OpenTok::OpenTok.new api_key, api_secret
      session = opentok.create_session
      call_session = CallSession.new(initiator_id: initiator_id, receiver_id: receiver_id, call_type: 'direct', session_id: session.session_id)
      if call_session.save
        call_session
      else
        nil
      end
    end
  end

  def self.request_group_call(initiator_id, channel_id)
    session = CallSession.where(channel_id: channel_id, call_type: 'group').first
    if session.present?
      session
    else
      api_key = ENV['OPENTOK_API_KEY']
      api_secret = ENV['OPENTOK_API_SECRET']
      opentok = OpenTok::OpenTok.new api_key, api_secret
      session = opentok.create_session :media_mode => :routed
      call_session = CallSession.new(initiator_id: initiator_id, channel_id: channel_id, call_type: 'group', session_id: session.session_id)
      if call_session.save
        call_session
      else
        nil
      end
    end
  end

  def create_token(data)
    api_key = ENV['OPENTOK_API_KEY']
    api_secret = ENV['OPENTOK_API_SECRET']
    opentok = OpenTok::OpenTok.new api_key, api_secret
    token = opentok.generate_token self.session_id, {data: data}
  end

end
