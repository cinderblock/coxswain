'use strict';

// Check if a previous version is running first and kill them if they still are.
require('./utils/runningProcessChecker.js')('../daemon.pid', 'kill');

import http from 'http';
import chalk from 'chalk';
import uuid from 'uuid/v4';

import ServerStarter from 'server-starter';

// Local dependencies
import debug from './utils/debug';
import makeClientHandler from './ClientUIHandler';
import Tunnel from './TunnelHandler';
import Storage from './storageHandler';
import github, { Repository } from './githubHandler';

const clientServer = http.createServer();
const hookServer = http.createServer();

const clientServerListen = 8000;
const hookServerListen = 8001;

const storage = Storage();

let repos: Repository[] | false | undefined;
let gh = github();

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
      storage
        .save({ token })
        .then(() => {
          debug.info('Token saved');
        })
        .catch(debug.error.bind(0, 'Failed to save:'));

      prepare();
    },

    async selectRepo(repo: Repository) {
      const repository = `github.com/${repo.owner.login}/${repo.name}`;

      debug.info('Selected repo:', repository);

      storage
        .save({ repository })
        .then(() => {
          debug.info('Repository selection saved');
        })
        .catch(debug.error.bind(0, 'Failed to save:'));

      prepare();
    },
  },
  (sock: SocketIO.Socket) => {
    const data = storage.get();
    sock.emit('authorized', !!(data && data.token));
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

const tunnel = Tunnel(hookServerListen);
tunnel.url().then(debug.variable.bind(0, 'Tunnel URL'));

async function prepare() {
  const data = storage.get();
  if (!data) return;

  const token = data.token;

  if (!token) {
    debug.notice('No token!');
    return;
  }

  remoteControlServer.emitAll('authorized', true);

  gh.authorize(token);

  repos = await gh.getRepositoryList();

  if (!repos) {
    remoteControlServer.emitAll('authorized', false);
    debug.error('Authorization failed');
    storage.save({ token: undefined });
    return;
  }

  debug.info('Loaded repos:', repos.length);

  remoteControlServer.emitAll('repositories', repos);

  const repository = data.repository;

  if (!repository) {
    debug.notice('No repository selected!');
    return;
  }

  const res = repository.match(/^(?<host>[^/]+)\/(?<owner>[^/]+)\/(?<name>[^/]+)$/);

  if (!res) {
    debug.error('Bad repository format:', repository);
    return;
  }

  console.log(res);

  const { host, owner, name } = res.groups as { host: string; owner: string; name: string };

  if (host !== 'github.com') {
    debug.error('Only github.com is supported currently');
    return;
  }

  const repo = repos.find(r => r.owner.login === owner && r.name === name);

  if (!repo) {
    debug.error('Repo not found');
    return;
  }

  // TODO: Make selectable and load default from GH
  const branch = 'master';

  runMain(repo, branch);
}

let running = false;
async function runMain(repo: Repository, branch?: string) {
  if (running) {
    debug.error('Trying to run twice...');
    return;
  }
  running = true;

  await storage.loaded;

  const data = storage.get();
  if (!data || !data.instanceID || !data.repository || !data.token) {
    running = false;
    return;
  }

  const runID = uuid();
  const URL = await tunnel.url();

  const hookURL = [URL, 'coxswain', data.instanceID, tunnel.id, runID].join('/');

  // TODO: Send URL to GH

  // TODO: on express event...

  // TODO: Handle shutdown somehow...

  running = false;
}

storage.loaded.then(() => prepare());
