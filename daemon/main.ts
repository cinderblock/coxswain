'use strict';

// Check if a previous version is running first and kill them if they still are.
require('./utils/runningProcessChecker.js')('../daemon.pid', 'kill');

import http from 'http';
import chalk from 'chalk';
import ServerStarter from 'server-starter';
import Koa from 'koa';

// Local dependencies
import debug from './utils/debug';
import makeClientHandler from './ClientUIHandler';
import Tunnel from './TunnelHandler';
import Storage from './storageHandler';
import github, { Repository } from './githubHandler';
import newConnection from './upstreams/github.com';
import EndpointManager from './EndpointManager';

const hooks = new Koa();

const clientServer = http.createServer();
const hookServer = http.createServer(hooks.callback());

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

    async token(token: string) {
      const data = await storage.data;
      if (!data) return;
      if (!data.upstreams) data.upstreams = [];

      if (!data.upstreams[0]) data.upstreams[0] = { service: 'github.com', token };

      if (data.upstreams[0].service !== 'github.com') throw Error('Only github supported');

      data.upstreams[0].token = token;

      storage
        .save()
        .then(debug.info.bind(0, 'Token saved'))
        .catch(debug.error.bind(0, 'Failed to save:'));

      prepare();
    },

    async selectRepo(repo: Repository) {
      const data = await storage.data;
      if (!data) return;
      if (!data.upstreams) data.upstreams = [];

      if (!data.upstreams[0]) throw Error('no upstreams configured');

      const upstream = data.upstreams[0];

      if (upstream.service !== 'github.com') throw Error('Only github supported');

      if (!upstream.repositories) upstream.repositories = [];

      const owner = repo.owner.login;
      const name = repo.name;

      if (!upstream.repositories[0]) upstream.repositories[0] = { owner, name };

      debug.info('Selected repo:', owner, name);

      storage
        .save()
        .then(() => {
          debug.info('Repository selection saved');
        })
        .catch(debug.error.bind(0, 'Failed to save:'));

      prepare();
    },
  },
  async (sock: SocketIO.Socket) => {
    const data = await storage.data;
    sock.emit('authorized', !!(data && data.upstreams && data.upstreams[0] && data.upstreams[0].token));
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
const endpoint = EndpointManager(tunnel);
tunnel.url.then(debug.variable.bind(0, 'Tunnel URL'));

async function prepare() {
  const data = await storage.data;
  if (!data || !data.upstreams || !data.upstreams[0]) return;

  const token = data.upstreams[0].token;

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
    data.upstreams[0].token = undefined;
    storage.save();
    return;
  }

  debug.info('Loaded repos:', repos.length);

  remoteControlServer.emitAll('repositories', repos);

  if (!data.upstreams[0].repositories || !data.upstreams[0].repositories[0]) {
    debug.notice('No repository selected!');
    return;
  }

  const { owner, name } = data.upstreams[0].repositories[0];

  const repo = repos.find(r => r.owner.login === owner && r.name === name);

  if (!repo) {
    debug.error('Repo not found');
    return;
  }

  if (!data.upstreams[0].repositories[0].instances) data.upstreams[0].repositories[0].instances = [];

  if (!data.upstreams[0].repositories[0].instances[0]) {
    // TODO: Make selectable
    data.upstreams[0].repositories[0].instances[0] = { branch: repo.default_branch };
  }

  newConnection(, data.upstreams[0]);
}

storage.data.then(prepare);
