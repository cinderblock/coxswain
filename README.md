# Coxswain

Daemon to handle deployments from push events.

Coxswain is a daemon that runs on arbitrary machines and automagically responds to push (or other) events from configured upstreams.
To bypass firewall issues, coxswain connects to a tunnel service and configures all endpoints to run through it.

For easy configuration, coxswain will also launch a web UI to manage upstream authentication, checkout configurations, and runtime information.

Initial support is targeted at github.com as an upstream and using ngrok.com's free tunnel service.
The code is nominally designed to work with any upstream or tunnel service.

## Planned Usage

### Manual

On target machine:

```bash
npx coxswain
```

By default, a UI will be available on port 9001.

Each "upstream" is one provider of files and associated push/update events.
Each upstream has their own configuration options.
Multiple connections to the same upstream service are supported.

Each upstream can have multiple "instances" of your application checked out and possibly executing.

## Development

### Cheat sheet

All of these are run from the top level directory.

| Command                        | Description                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| `yarn setup`                   | Setup your local machine for development                     |
| `yarn ui setup dev`            | Run the web **ui** in development mode on your local machine |
| `yarn daemon setup dev`        | Run **daemon** in development mode on your local machine     |
| `yarn ui add some-package`     | Add `some-package` to the ui                                 |
| `yarn daemon add some-package` | Add `some-package` to the daemon                             |
| `yarn ui upgrade`              | Upgrade ui packages to latest version                        |

### Program flow

![Program flow diagram](Program%20Flow%20Diagram.drawio.png)

_Use [draw.io](https://draw.io) to edit this diagram. [Desktop Clients](https://about.draw.io/integrations/#integrations_offline)_

### Prerequisites

[**Node 10+**](https://nodejs.org/en/download) must be installed on your development system.

```bash
npm install
```

### Running

To run this full system, **two** separate programs need to be run.
One for the web **UI** and one to actually do something persistent, the **daemon**.

Most commands are intended to be run **on your development machine** and **not** directly on the remote system.
