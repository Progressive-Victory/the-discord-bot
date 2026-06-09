# state
## command
state-name = state
state-description = Functions to help state leads

## Ping command
ping-name = ping
ping-description = Ping State Role
ping-state-name = state
ping-state-description = State to ping
ping-channel-description = Channel where the ping will be sent
ping-message-name = message
ping-message-description = Message you wish to add to the ping
ping-cant-send = Message can't be sent in {$channel}
ping-not-no-perms = {$user} does not have permission to send message
ping-success = Ping message has been sent
ping-role-match-fail = Channel and selected role do not match. Please selected a different role or use in the correct channel
ping-sent-by = Sent by {$user}
ping-no-thread = Command can not be used in a thread. Use the state text channel

## Member list
### Command
member-list-name = members
member-list-description = Exports a list of the users in each role as a csv file
### Command Options
member-list-role-option-name = role
member-list-role-option-description = The role from which to get list

### follow-up
member-list-message-followup = Members in {$role} role
