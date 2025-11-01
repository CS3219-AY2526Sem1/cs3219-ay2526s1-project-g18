-- join_queue.lua
-- KEYS[1] = user key (e.g. "users:123")
-- KEYS[2] = queue criteria (e.g. "queue:specific:topic:0")
-- ARGV[1] = time value as string (e.g. "0")
-- ARGV[2] = queueList JSON (e.g. '["queue:specific:topic:0"]')
local user_key = KEYS[1]
local queue_criteria = KEYS[2]
local time_val = ARGV[1]
local queue_list_json = ARGV[2]

if redis.call("EXISTS", user_key) == 0 then
  redis.call("HSET", user_key, "time", time_val, "queueList", queue_list_json)
  redis.call("LPUSH", queue_criteria, user_key)
  return 1
else
  return 0
end