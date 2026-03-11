# Vertical Slice Architecture for Event Sourcing

## CQS Surface Interaction

Users interact with applications by sending two types of requests by using some kind of user interface:

- **Command**: Commands change the state of and application by recording events. The just return a (success) status including maybe some meta data, eg. an id or the number of affected data.
- **Query**: Queries read state by retrieving events and constructing a response data structure from them to be returned to the requester.

Commands and queries carry parameters to be used during processing.

All requests are triggered through a user interface and are processed by an entry point function. This function is called entry point, because it‘s where data/control enters the body of an application. Form there on all processing is independent from any user interface.

## Application Structure

The code of an application storing state using event sourcing is very simple seen from afar: it consist of a head and a body. This is called a "Sleepy Hollow Architecture" (IODA.SH).

- The **head** contains the user interface, whatever technology might be used for that, e.g. a GUI or Console UI or a REST controller.
- The **body** actually does all the work. It's completely independent of any user interface; it's user interface technology agnostic. The body contains all the domain logic and does all necessary resource access (e.g. calling REST services or storing data in a database or in the file system or accessing the system clock or random number generator).

The head is just the means for an application to interact with the user, to enable the user to request services from the body.

### Body Structure

The body is structured in a particular way in an event sourced application. This structure is optimized for maximum development productivity.

#### Processor

The body's interface to the head is the Processor. The Processor is the module to expose all entry point functions.

Each entry point function serves a head request. Each command and each query is processed by a Processors dedicated process function.

The Processor is the body's surface. It provides the interface to any user interface and also to automated (acceptance) tests.

#### Slices

Internally the Processor's task is simple: it delegates request processing to Slices. Slices are all independent of each other and are working on application state all by themselves.

Slices are modules representing user requests internally. Slices only share the event store. They read from it, they write to it. But they do not communicate with each other. This is called a "Vertical Slice Architecture" (VSA).

Slices of course also might share other services, e.g. for encrypting/descrypting data or accessing a database. But those services are not concerned with the application state.

Persistent application state is like memory: just there, ubiquitous. It's not a special service, but a common medium.

All slices thus are injected with the same event store. That's the only commonality they have. All else is particular on an as needed basis. The goal is to keep slices as separate from each other as possible. (That even might entail a form of code duplication. Slices should solve problems for themselves first.)

Each slice implements a command and produces a status or implements a query and delivers a result.

##### Anatomy of a Slice

Slices are structured in a very simple way:

1. Validation: Check the request data for validity. Are all parameters provided, are they within acceptable ranges?
2. Context retrieval: Query the event store for all relevant events (event type, event id, payload pattern) to process the request.
3. Context model construction: Build a minimal data model from the context events. Reduce them to a data structure which makes request processing most easy.
4. Request processing: Process the request by using the context model. The context model may be changed during processing if it was build just-in-time. It then is a throw-away data structure. Queries produce their results in this step, commands produce new events in this step.
5. Record new events (only commands): Commands change the application state by recording new commands.

**Conditional append**: Changing the application state might depend on it not having changed during command processing to ensure consistent state change. In that case appending events is conditional.

In a conditional append the initial context query (step 2) is run again (internally by the event store) and it is checked that it still returns the same number of events. Only if that is the case the new events are appended. (Both happens inside a single transaction.)

Should the number of events be not the same, the event store must have changed in a relevant way betweenn steps 2 and 5. It might now be in a state which would change the processing result. Hence, either the request has to fail or be retried.

#### Dice

Slices should be very focused. Sometimes, though, requests demand quite elaborate processing. Later steps in processing might depend on state changes applied by earlier ones.

In that case an entry point may integrate multiple slices into a data flow. First it calls one slice, then feeds its output to another, afterwards calls another slice, and finally yet another.

Calling slices might be conditional, but never happens in a loop! The data flows unidirectional from the first to the last slice called in such an entry point function.

Viewed from the outside, an entry point should always match a single request handled by a single slice. Since now a slice can be composed of multiple slices, those integrated one's better be called differently. An catchy name seems to be "die" or "dice". Implementing event sourcing then is a process of "slicing and dicing".

