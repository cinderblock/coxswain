# Coxswain

Daemon to handle deployments from push events.

## Usage

#### Planned

- Run daemon on target machine
- Connect to Daemon via web UI
- Give daemon github oauth token
- Select Repository & branch to deploy
- Select deploy folder on target
- Run deploy scripts?

## Development

This is very hacky at the moment.
Just trying to get to a proof of concept quickly and will clean it up later.

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
