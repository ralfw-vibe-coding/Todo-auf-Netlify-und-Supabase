# Event Sourcing

Application state is stored as a stream of data changes (differences) triggered by events.

Each event decribes a situation, what happened, the semantics, meaning of the change in data (event type).

And each event carries the actual data that changed or just came along with the event and need recording.

The basic form of an event:

```json
{
  eventType: "...",
  payload: {
    ... // data of event
  }
}
```

Event types are phrased in past tense, eg. „gameStarted“. They describe something that has happened already.

The payload can be structured differenty for every event type. It can be big or small, shallow or deep.

## Identifying Events

Each event has an id named like the type with the suffic „Id“, eg. „gameStartedId“.

```json
{
  eventType: "gameStarted",
  payload: {
    playernames: ["Peter", "Paul"],
    gameStartedId: "123"
  }
}
```

Event ids are not object ids or DDD Entity ids or Aggregate root ids. Event sourcing has nothing to do with object orientation or relational databases. It‘s about unique points in time only. Event ids give points in time a label which easily can be referenced. They are like application defined version numbers for the whole event stream.

## Scoping Events

Events can follow each other in a chain of events. One event can be based on, or be the result of a previous event. A later event can reference an earlier event for whatever reason. It then falls into the scope of the earlier event.

Every event can be the root of a scope of events. Related events (pointing back at it) are then nested into this scope. The scope root event serves as the anchor for subsequent.

Example:

- A student enrolled in a course
- A student was assigned a grad in a course

The second event can be related to the first. Only because the student had been enrolled in a course she could be given a grade (in that course).

The grading event thus is part of the scope of the enrollment event.

Scopes can contain other scopes. Events can relate to each other across many levels. Example:

- A student enrolled in a course
- A student submitted a paper in a course
- A student‘s paper got graded

The immediate scope of the grading event is the paper submission event. But since the paper submission happened inside the enrollment event‘s scope, the grading event is also parr of that.

The paper submission scope is nested inside the enrollment scope.

When an event is recorded, it is not yet known if it will ever open a scope. That happens retroactively when a later event references it as a scope root.

Such references are also part of the payload. Example:

```json

{
  eventType: "studentEnrolled",
  payload: {
    studentEnrolledId: "abc",
    ...
  }
}
...
{
  eventType: "paperSubmitted",
  payload: {
    paperSubmittedId: "1x6",
    ...
    scopes: {
      studentEnrolledId: "abc"
    }
  }
}
...
{
  eventType: "paperGradwd",
  payload: {
    paperGradedId: "9he",
    ...
    scopes: {
      paperSubmitteeId: "1x6",
      studentEnrolledId: "abc"
    }
  }
}
```

Scope root references are not object references. They are no connections between Entities or tie events together in DDD Aggregates. Also they are no foreign keys from relational databases. They are just pointers back in time to an earlier event.

All references back to earlier events are wrapped in the scopes property. The event ids of all parent scopes are listed, not just the id of the immediate scope! This is to make retrieval easier: the events inside any scope, regardless how high up the hierarchy, can be queried for by looking for this payload pattern:

```json
{ scopes: { <eventIdName>: "<eventId>" } }
```

The eventId to look for is that of the scope‘s root event.

To also retrieve the root event of a scope as well as its member events, it has to be queried for explixcitly. The query pattern needs expansion:

```json
{ <eventIdName>: "<eventId",
payload: {
{ scopes: { <eventIdName>: "<eventId>" } } } }
```

Only a query for this returns the full story of a scope across all nesting levels.

Events are recorded in time. They are related naturally as earlier/later. But later does not necessarily mean correlated/connected.

To establish a correlation, maybe even a causation, events have to be explixitly related. That‘s done through scopes.

Scopes define subsets of events all related to the same earlier, root event (which might be even a cause).