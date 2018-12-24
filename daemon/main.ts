'use strict';

// Check if a previous version is running first and kill them if they still are.
require('./utils/runningProcessChecker.js')('../daemon.pid', 'kill');

import * as http from 'http';
import chalk from 'chalk';

const ServerStarter = require('server-starter');

// Local dependencies
import debug from './utils/debug';
import makeClientHandler from './ClientUIHandler';
import tunnel from './TunnelHandler';
import auth from './authHandler';
import github, { Repository } from './githubHandler';

const clientServer = http.createServer();
const hookServer = http.createServer();

const clientServerListen = 8000;
const hookServerListen = 8001;

const Token = auth();

let repos: Repository[] = [];
let gh: any;

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

// Events from the clients and how to handle them
const remoteControlServer = makeClientHandler(
  clientServer,
  {
    // This event happens when mobile devices report their orientation data to the server.
    // This could be very useful as a remote.
    // Careful, this event happens at ~60Hz.
    deviceorientation: (orientation: { alpha: number; beta: number; gamma: number; absolute?: boolean }) => {
      // debug.log(orientation);
    },

    // Shut the whole thing down.
    Shutdown,

    token(token: string) {
      Token.save(token).then(
        () => {
          console.log('Token saved');
        },
        e => {
          console.log('Failed to save token file:', e);
        }
      );

      main();
    },

    async selectRepo(repo: Repository) {
      const hooks = await gh.getHooks(repo);
      console.log(hooks && hooks.length);
    },
  },
  (sock: SocketIO.Socket) => {
    sock.emit('authorized', !!Token.get());
    sock.emit('repositories', repos);
  }
);

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

async function main() {
  const token = Token.get();

  if (!token) {
    debug.notice('No token!');
    return;
  }

  // console.log('URL:', await tunnel(hookServerListen).url());

  remoteControlServer.emitAll('authorized', true);
  gh = github(token);

  repos = await gh.getRepositoryList();

  debug.info('Loaded repos:', repos.length);

  remoteControlServer.emitAll('repositories', repos);
}

debug.green('Hello, world.');

Token.loaded.then(() => main());
