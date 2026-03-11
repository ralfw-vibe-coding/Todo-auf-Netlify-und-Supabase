# Postgres Event Store

The Event Store records events in a Postgres database. Events can subsequently be "played back" in their entirety or filtered.

The Event Store serves to demonstrate the CCC approach to Event Sourcing. CCC = Command, Query, Consistency. Articles on the topic [here (Ralf Westphal)](https://ralfwestphal.substack.com/s/event-orientation) and [here (Rico Fritzsche)](https://ricofritzsche.me/tag/event-sourcing/).

Literature on the topic of Event Sourcing:

- [Understanding Eventsourcing, Martin Dilger](https://leanpub.com/eventmodeling-and-eventsourcing)
- [Event Sourcing, Greg Young](https://leanpub.com/eventsource)
- [Patterns of Event Sourced Systems, Greg Young](https://leanpub.com/patternsofeventsourcedsystems)

## Import

The Event Store framework can be imported as follows after installation:

```typescript
import { PostgresEventStore, MemoryEventStore, createQuery, createFilter } from '@ricofritzsche/eventstore';
```

### Installation

```
npm install @ricofritzsche/eventstore
```

## Interface

### Interfaces

The framework publishes the following interfaces:

```typescript
export interface Event {
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
}

export interface EventRecord extends Event {
  readonly sequenceNumber: number;
  readonly timestamp: Date;
}

export interface EventFilter {
  readonly eventTypes: string[]; // OR
  // AND
  readonly payloadPredicates?: Record<string, unknown>[]; // OR
}

export interface EventQuery {
  readonly filters: EventFilter[]; // OR
}

export interface QueryResult {
  events: EventRecord[];
  maxSequenceNumber: number;
}

export interface EventStore {
  query(filterCriteria: EventQuery): Promise<QueryResult>;
  query(filterCriteria: EventFilter): Promise<QueryResult>;

  append(events: Event[]): Promise<void>;
  append(events: Event[], filterCriteria: EventQuery, expectedMaxSequenceNumber: number): Promise<void>;
  append(events: Event[], filterCriteria: EventFilter, expectedMaxSequenceNumber: number): Promise<void>;
  
  subscribe(handle: HandleEvents): Promise<EventSubscription>;
}

// Import types from the event stream for subscription functionality
export type HandleEvents = (events: EventRecord[]) => Promise<void>;

export interface EventSubscription {
  readonly id: string;
  unsubscribe(): Promise<void>;
}

export interface Subscription {
  id: string;
  handle: HandleEvents;
}

export interface EventStreamNotifier {
  subscribe(handle: HandleEvents): Promise<EventSubscription>;
  notify(events: EventRecord[]): Promise<void>;
  close(): Promise<void>;
}
```

### Classes

```typescript
export interface PostgresEventStoreOptions {
  connectionString?: string;
  notifier?: EventStreamNotifier;
}

export class PostgresEventStore implements EventStore {
  constructor(options: PostgresEventStoreOptions = {}) {
    ...
  }

  async query(filterCriteria: EventQuery): Promise<QueryResult>;
  async query(filterCriteria: EventFilter): Promise<QueryResult>;
  async query(filterCriteria: EventQuery | EventFilter): Promise<QueryResult> {
    ...
  }

  async subscribe(handle: HandleEvents): Promise<EventSubscription> {
    ...
  }


  async append(events: Event[]): Promise<void>;
  async append(events: Event[], filterCriteria: EventQuery, expectedMaxSequenceNumber: number): Promise<void>;
  async append(events: Event[], filterCriteria: EventFilter, expectedMaxSequenceNumber: number): Promise<void>;
  async append(events: Event[], filterCriteria?: EventQuery | EventFilter,  expectedMaxSequenceNumber?: number): Promise<void> {
    ...
  }

  async initializeDatabase(): Promise<void> {
    ...
  }

  async close(): Promise<void> {
    ...
  }
}
```

```typescript
export class MemoryEventStore implements EventStore {
  constructor(writeThruFilename?: string) {
    ...
  }

  async query(): Promise<QueryResult>;
  async query(eventQuery: EventQuery): Promise<QueryResult>;
  async query(eventFilter: EventFilter): Promise<QueryResult>;
  async query(queryOrFilter?: EventQuery | EventFilter): Promise<QueryResult> {
    ...
  }

  async queryAll(): Promise<QueryResult> {
    ...
  }


  async append(events: Event[]): Promise<void>;
  async append(events: Event[], filterCriteria: EventQuery, expectedMaxSequenceNumber: number): Promise<void>;
  async append(events: Event[], filterCriteria: EventFilter, expectedMaxSequenceNumber: number): Promise<void>;
  async append(events: Event[], queryOrFilter?: EventQuery | EventFilter,  expectedMaxSequenceNumber?: number): Promise<void> {
    ...
  }


  async subscribe(handle: HandleEvents): Promise<EventSubscription> {
    ...
  }


  async storeToFile(filename: string): Promise<void> {
    ...
  }

  static async createFromFile(
    filename: string,
    ignoreMissingFile: boolean = false,
    writeThruMode: boolean = false,
  ): Promise<MemoryEventStore> {
    ...
  }  
}
```

## Usage Example

### In-Memory Event Store

```typescript
import { MemoryEventStore, createFilter, createQuery } from "@ricofritzsche/eventstore";

const es = new MemoryEventStore();
// const es = new MemoryEventStore("events.json"); // create in write-thru mode
// const es = MemoryEventStore.createFromFile("events.json", true, true); // create in write-thru mode and don't crash on missing file

// Recording an event. Every event has an eventType and a type-specific payload.
// If a payload is specified in a filter, events of all types in the filter must contain this payload.
await es.append([{eventType:"e1", payload:{message:"hello"}}])
await es.append([{eventType:"e2", payload:{amount:99}}])

// Querying events with a filter. 
// Event types can be passed to a filter like this:
const context = await es.query(createFilter(["e1"]));

// A filter can also take the payload into account:
const context2 = await es.query(createFilter(["e1"], [{message:"hello"}]));

// Complex filters can be formulated as a Query.
// The filters within a Query are internally linked with OR.
const query = createQuery(createFilter(["e1"]), createFilter(["e2"]));
const context3 = await es.query(query);

// Conditional append: An append can also be performed with a Query.
// In this case, the events are only recorded if the Event Store
// has remained unchanged since the previous execution of the query:
await es.append([{eventType:"e1", payload:{message:"hello"}}], query, context3.maxSequenceNumber);

// es.storeToFile("events.json"); // store events in a file
```

### Postgres Event Store

```typescript
import { PostgresEventStore, createFilter, createQuery } from "@ricofritzsche/eventstore";

const es = new PostgresEventStore( {connectionstring: "..."} ); 
await es.initializeDatabase();

// use Postgres event store the same as in-memory event store

await es.close(); // at the end properly close connection to database
```