# Coxswain

Daemon to handle deployments from push events.

## Usage

WIP/TBD

## Development

### Prerequisites

[**Node 8+**](https://nodejs.org/en/download) must be installed on your development system.

```bash
npm install
```

### Running

To run this full system, **two** separate programs need to be run.
One for the web **UI** and one to actually do something persistent, the **daemon**.

Most commands are intended to be run **on your development machine** and **not** directly on the remote system.

## Cheat sheet

All of these are run from the top level directory.

| Command                        | Description                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| `yarn setup`                   | Setup your local machine for development                     |
| `yarn ui setup dev`            | Run the web **ui** in development mode on your local machine |
| `yarn daemon setup dev`        | Run **daemon** in development mode on your local machine     |
| `yarn ui add some-package`     | Add `some-package` to the ui                                 |
| `yarn daemon add some-package` | Add `some-package` to the daemon                             |
| `yarn ui upgrade`              | Upgrade ui packages to latest version                        |

| Remote commands        | Need configuration                                                |
| ---------------------- | ----------------------------------------------------------------- |
| `yarn remote upgrade`  | Upgrade daemon packages to latest version using the remote's yarn |
| `yarn remote kill`     | Kill the daemon on remote                                         |
| `yarn remote shutdown` | Shutdown the remote system                                        |
| `yarn remote reboot`   | Reboot the remote system                                          |
