'use strict';

// Check if a previous version is running first and kill them if they still are.
require('./utils/runningProcessChecker.js')('../daemon.pid', 'kill');

import http from 'http';
import chalk from 'chalk';
import ServerStarter from 'server-starter';

// Local dependencies
import debug from './utils/debug';
import makeClientHandler from './ClientUIHandler';
import Tunnel from './TunnelHandler';
import Storage from './StorageHandler';
import Endpoint from './EndpointHandler';
import { map } from 'rxjs/operators';
import Upstream from './UpstreamHandler';
import { URL } from 'url';

const clientServer = http.createServer();
const hookServer = http.createServer();

const clientServerListen = 8000;
const hookServerListen = 8001;

const clientServerOptions = {
  listen: clientServerListen,
  // listen: '/tmp/daemon.sock',
  // socketMode: 0o777,
  // socketOwner: {
  //   //user: 'pi',
  //   group: 'www-data',
  // },
};

const hookServerOptions = {
  listen: hookServerListen,
  // listen: '/tmp/daemon.sock',
  // socketMode: 0o777,
  // socketOwner: {
  //   //user: 'pi',
  //   group: 'www-data',
  // },
};

function serverStartup(which: string) {
  return (err?: Error, info?: string, extra?: string) => {
    if (err) {
      console.log(chalk.red(which + ' server error:'), err, info, extra);
    } else {
      // console.log('Listening:', info);
    }
  };
}

const storage = Storage();

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

    // TODO: Handle events from clients...
  },
  async (sock: SocketIO.Socket) => {
    const data = await storage.data;
    // TODO: Initialize client
    // sock.emit('authorized', !!(data && data.upstreams && data.upstreams[0] && data.upstreams[0].token));
    // sock.emit('repositories', repos);
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
const endpoint = Endpoint(hookServer);

ServerStarter(clientServer, clientServerOptions, serverStartup('Client'));
ServerStarter(hookServer, hookServerOptions, serverStartup('Hook'));

async function prepare() {
  const data = await storage.data;
  if (!data || !data.upstreams) return;

  for (let upstreamID in data.upstreams) {
    const upstreamConfig = data.upstreams[upstreamID];

    const hookUrl = tunnel.pipe(map(url => [url, '_coxswain', data.coxswainID, upstreamID].join('/')));

    const upstream = Upstream(upstreamConfig, hookUrl);

    const hookPath = hookUrl.pipe(map(url => new URL(url).pathname));

    endpoint.registerMiddleware(hookPath, upstream.middleware);
  }
}

storage.data.then(prepare);

tunnel.subscribe(debug.variable.bind(0, 'Tunnel URL'));
