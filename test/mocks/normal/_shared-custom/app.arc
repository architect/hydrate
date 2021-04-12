# _shared-custom + specified views

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

@streams
rivers

@shared
src custom-shared-folder

@views
src custom-views-folder

@plugins
myplugin

@myplugin
newlambda
