'use strict';

// Check if a previous version is running first and kill them if they still are.
require('./utils/runningProcessChecker.js')('../daemon.pid', 'kill');

import http from 'http';
import chalk from 'chalk';

// Local dependencies
const debug = require('./utils/debug.js');
const makeClientHandler = require('./ClientUIHandler.ts');
const ServerStarter = require('server-starter');

import tunnel from './TunnelHandler';

const clientServer = http.createServer();
const hookServer = http.createServer();

const clientServerListen = 8000;
const hookServerListen = 8001;

ServerStarter(
  clientServer,
  {
    listen: clientServerListen,
    // listen: '/tmp/daemon.sock',
    // socketMode: 0o777,
    // socketOwner: {
    //   //user: 'pi',
    //   group: 'www-data',
    // },
  },
  (err?: Error, info?: string, extra?: string) => {
    if (err) {
      console.log(chalk.red('Client server error:'), err, info, extra);
    } else {
      // console.log('Listening:', info);
    }
  }
);

ServerStarter(
  hookServer,
  {
    listen: hookServerListen,
    // listen: '/tmp/daemon.sock',
    // socketMode: 0o777,
    // socketOwner: {
    //   //user: 'pi',
    //   group: 'www-data',
    // },
  },
  (err?: Error, info?: string, extra?: string) => {
    if (err) {
      console.log(chalk.red('Hook server error:'), err, info, extra);
    } else {
      // console.log('Listening:', info);
    }
  }
);

(async function() {
  console.log('URL:', await tunnel(hookServerListen).url());
})();

// Events from the clients and how to handle them
const remoteControlServer = makeClientHandler(clientServer, {
  // This event happens when mobile devices report their orientation data to the server.
  // This could be very useful as a remote.
  // Careful, this event happens at ~60Hz.
  deviceorientation: (orientation: { alpha: number; beta: number; gamma: number; absolute?: boolean }) => {
    // debug.log(orientation);
  },

  // Shut the whole thing down.
  Shutdown,
});

debug.green('Hello, world.');

function Shutdown() {
  setImmediate(() => {
    // Shutdown remote control server
    remoteControlServer.close();

    // Just kill the process in a short time in case we've forgotten to stop something...
    setTimeout(() => {
      debug.error('Something is still running...');
      debug.warn('Forcing a shutdown.');
      process.exit(0);
    }, 100).unref();
  });
}
