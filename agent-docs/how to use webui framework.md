# User Interface done with WebUI

For applications running locally use WebUI to build a GUI.

Make the design clean and simple. Follow the style of shadcn/ui as much as possible.

## Basic usage

### Setting up the "server"

```
import { WebUI } from "jsr:@webui/deno-webui";

const html = await Deno.readTextFile("./index.html");

const win = new WebUI();
await win.showBrowser(html, WebUI.Browser.AnyBrowser);
await WebUI.wait();
```

### Binding of host functions

The HTML can call back to the backend through functions made know to it by bindings.

Example:

The backend defines some function in a module. The function is independent of any frontend technology:

```
// a backend function e.g. in processor.ts

export async function getGreeting(name: string): Promise<string> {
..
}

```

Such functions are bound to WebUI in a separate module backendbindings.ts like so:

```
// backendbindings.ts

win.bind("getGreeting", async (e) => {
  const name = e.arg.string(0);
  return await getGreeting(name);
});

```

This is the kind of structure the parameter `e` has:

```
{
  window: WebUI {},
  eventType: 4,
  eventNumber: 1,
  element: "getGreeting",
  arg: {
    number: [Function: number],
    string: [Function: string],
    boolean: [Function: boolean]
  }
}
```

### Using host functions

In the backend care must be taken to extract the parameters from `e` matching number and order of the bound function.

The WebUI object `win` has to be made know to this module.

In the HTML frontend these bound functions can be called.
All such calls must be wrapped in a proxy object BackendProxy in backendproxy.js like so:

```
// backendproxy.js

class BackendProxy {
  async getGreeting() {
    const greeting = await webui.call('getGreeting', 'Peter');
    return greeting;
  }
}
```

### Calling backend functions right at the start

Some applications open their page and immediately want to display data provided through a backend function. This is difficult with WebUI, because its main `webui` object might not yet be instanciated in the browser or not yet connected to the backend.

The workaround for this is to explicitly wait for the WebUI object to be ready. Here is a function doing that:

```
  constructor() {
    this._readyPromise = null;
  }
  
  async waitReady(options = {}) {
    const timeoutMs = options.timeoutMs ?? 8000;
    const pollMs = options.pollMs ?? 80;

    if (this._readyPromise) return this._readyPromise;

    this._readyPromise = (async () => {
      const start = Date.now();
      while (true) {
        if (window.webui && typeof window.webui.call === "function") {
          try {
            await window.webui.call("ping");
            return true;
          } catch {
            // not connected yet
          }
        }
        if (Date.now() - start > timeoutMs) {
          throw new Error("WebUI nicht verbunden (Timeout).");
        }
        await new Promise((r) => setTimeout(r, pollMs));
      }
    })();

    return this._readyPromise;
  }
```
This function could be called just once after a page first got rendered. Or it could be transparently called with each call to a backend function:

```
  async _call(method, payload) {
    await this.waitReady();
    if (payload === undefined) return await webui.call(method);
    return await webui.call(method, payload);
  }
```

Each backend proxy function would not call the `webui` object directly, but this wrapper.

## Asset location

If additional files are needed (e.g. css, js, images) they are assumed to be located relative to where the "server" is located.
This is the default for WebUI.