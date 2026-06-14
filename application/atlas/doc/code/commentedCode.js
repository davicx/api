/*
4. I would keep the mapper extremely temporary
This:

response.type
    ↓
mapResponseType
    ↓
actionEvent

is okay for migration.
But I'd put a giant comment on it:

TEMPORARY COMPATIBILITY LAYER
DELETE AFTER CloudPilotChat USES response.type

Otherwise those files survive forever.
I've seen 5-line migration helpers survive for 4 years.

One thing I would change
This part:


{
  "replaceOpenRequest": true
}

is showing up even when there is no open request.
Example:


{
  "pendingAction": null
}

then:


{
  "replaceOpenRequest": true
}

for a brand new scan.
Not a bug, but slightly confusing.
I'd expect:




*/