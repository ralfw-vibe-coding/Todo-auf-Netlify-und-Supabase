# The IODA Architecture

In the IODA architecture, all functional modules are independent of each other. These are the modules that communicate with the environment as well as the domain.

IODA fundamentally distinguishes between 3+1 module categories:

1. **Portals:** These are modules through which the environment interacts to trigger behavior in a program. A user interface belongs here, as does an HTTP controller/REST router.
2. **Providers:** These are modules that communicate with the environment when the program "needs something." Database access, file access, email dispatch, access to time, and random number generators are encapsulated in providers.
3. **Domain:** These are modules that have nothing to do with the environment and implement the core of the application—its purpose. They do not need to have any knowledge of technological details or infrastructure.
4. **Integration:** These are modules that group others together. Their functions are about establishing a data flow between the functional modules to exhibit the desired program behavior.

Integration knows/uses the functional modules; the functional modules know and use neither the integration nor other functional modules.

In this way, all functional modules are very easy to test.

If interfaces are needed for modules, they can be defined within the respective modules or separately in their own contract file.

### Data

Integration combines functional modules (or other integrations) into a data flow. There is no logic within the integration.

Because functional modules do not use each other, there are no dependencies between them. To still be able to work together within an integration, functional modules share data. Multiple functional modules can therefore depend on the same data types/data structures.

However, data structures—even if they are classes/objects—generally contain no logic. If logic is included, it relates only to the data itself.

## Sleepy Hollow Architecture

The Sleepy Hollow architecture (IODA.SH) is a variation of the IODA architecture.

In IODA.SH, there are two integrations:

- **Processor:** Integrates the domain with the providers.
- **Application:** Integrates the portal with the processor.

Processor, Provider, and Domain together are called the **Body**. The Processor is the surface of the Body with an interface providing entry points to trigger Body "reactions".

Application and Portal, with their dependency on the Body, are called the **Head**.

This separation makes it easy to keep the Body unchanged while replacing the Head.

The Body is the workhorse of every program. 

The Head is merely an interface to the environment for user interactions with the program. The same Body can run, for example, with a console UI, a GUI, or an HTTP controller/REST router.

The Body also is the primary target of automated (acceptance) tests to ensure overall application correctness.