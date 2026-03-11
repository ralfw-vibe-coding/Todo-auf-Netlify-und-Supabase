# When to record events in an event sourced application

## External facts
The obvious event is one related to something outside the application; something happened in the real world and the application is triggered to work with that. External events are internalized, they are recorded in the application’s event stream because they change the application’s state.

Examples are:

- a task gets created
- a task gets checked-off
- money is withdrawn from a bank account
- a product is put into a shopping card

All these events in the real world should of course be recorded as events in the respective software systems. And maybe they even should be correlated with the command triggering this change.

## Impact on the environment
An application does not just receive notifications about changes to the external world, it also acts on its environment. Whenever such an intervention is not idempotent or expensive it shoud be recorded. Examples for this are:

- after sign-up an email was sent to request a confirmation
- a task became overdue and the user got notified
- the schema of database was updated

If such side-effects would not be recorded a re-interpretation of events might trigger them again and cause damage or confusion.

This category of events also covers events triggerin obligations. If for example a certain pattern of withdrawls is deemed suspicious and requires reporting, then that should be recorded.

## Major lifecycle changes
Related events might be part of a lifecycle of a scope. An example of that would be a game with a starting event and an ending event. Game rules would determine when it’s time to transition the started/running game to a finished status.

Some other examples:

- a contract expires
- processing of data is cancelled due to an error

If a lifecycle change is reported by the user, that’s an external fact (e.g. a game is started). This additional event category is concerned with changes determined by internal rules: a game is finished automatically when, for example, a player made a certain move. The move is the external fact. But in addition the end of the game resulting maybe from a certain configuration of tokens on a game board is recorded.

## Keeps interpretation stable
Events are unchangeable, logic can change at any time. Logic interprets events. Example: the rules of a game determine when which player wins. As long as the rules don’t change, reading the events multiple times won’t change the result.

But what if the rules change? Maybe that could lead to a different winner? If the winner of a game is beyond re-interpretation of events, then the decision should be recorded when it’s first reached.

Another example: Today a discount may apply if the total price of the items in a shopping cart reaches a certain limit. Applying the discount could be a matter of a query. But if the discount rules change in the future, the total price might be reported differently. To prevent that, granting the discount should be recorded.

This might be a narrow line to walk: the event stream should stay open for re-interpretation as much as possible, but at the same time it should not promote distortions/misunderstandings.

This might be the hardest category of events. There can be a tendency to record too many events to persist every change, every decision in the application state. But that puts a burden on commands, increases the number of events to juggle, and narrows too much future re-interpretations.

An example of that would be recording strikes and spares in a bowling game in addition to the raw throws with the pins knocked down. Yes, a decision has to be made if a frame is a strike or spare, but that’s transient. It’s only of temporal value while calculating the current score.

Just because something looks like an important decision does not mean it has to be recorded. If it is cheap and can be made again and again and again, then there is not need to create an event for it.

## Documentation of failure
The user has a request for changing the application state, but that fails. The external fact cannot be recorded as expected. An error response is returned from the command.

This suggests a closer look. Sometimes nothing more needs to be done. But sometimes a failure is an event worth recording. Here is an example: A user attempts a login, but fails. She tries again and again. Is that noteworthy? Yes, because it might not be a case of a forgotten password, but an attack. In this case it’s warranted to record failed attempts and maybe after the third within a certain period send a notification to the email address associated with the account.

Or an application tries to connect to a service. If that’s not available some “silent” retries might be in order, but after a while they should be stopped, the failure recorded, and the user notified.

If a failure or violations of rules or a need to reject requests for any reason are encountered, a closer look is warranted, if it’s helpful to record an event. Later these events might provide insights for improving the system.