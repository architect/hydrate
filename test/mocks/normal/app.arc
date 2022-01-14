@app
hydrate

@http
get     /
get     /memories
post    /up/tents
put     /on_your_boots
delete  /badness-in-life
/in-the-clouds
  method head
  src src/head/in-the-clouds
any     /time-is-good/*
/where
  method any
  src anywhere
/multiples
  method get
  src src/http/multiples
/api/v1/multiples
  method get
  src src/http/multiples
/api/v2/multiples
  method get
  src src/http/multiples

@events
just-being-in-nature
silence # intentionally does not exist

@scheduled
hikes-with-friends rate(7 days)

@queues
parks-to-visit

@tables
trails
  trail *String
  stream true

rivers
  river *String

@tables-streams
rivers

@plugins
myplugin
