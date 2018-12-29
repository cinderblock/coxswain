'use strict';

// Check if a previous version is running first and kill them if they still are.
require('./utils/runningProcessChecker.js')('../daemon.pid', 'kill');

import chalk from 'chalk';
import http from 'http';
import { AddressInfo } from 'net';
import { map } from 'rxjs/operators';
import ServerStarter from 'server-starter';
import { URL } from 'url';

import makeClientHandler from './ClientUIHandler';
import Endpoint from './EndpointHandler';
import Config from './ConfigHandler';
import Tunnel from './TunnelHandler';
import Upstream, { UpstreamOptions } from './UpstreamHandler';
import debug from './utils/debug';

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
  return (err: null | Error | string, info: AddressInfo | string | Error, extra?: Error) => {
    if (err) {
      console.log(chalk.red(which + ' server error:'), err, info, extra);
    } else {
      console.log(which + ' Listening:', info);
    }
  };
}

const config = Config();

// Events from the clients and how to handle them
const remoteControlServer = makeClientHandler(
  {
    // This event happens when mobile devices report their orientation data to the server.
    // This could be very useful as a remote.
    // Careful, this event happens at ~60Hz.
    deviceorientation: (orientation: { alpha: number; beta: number; gamma: number; absolute?: boolean }) => {
      // debug.log(orientation);
    },

    // Shut the whole thing down.
    Shutdown,

    async newUpstream(opts: UpstreamOptions) {
      config.newUpstream(opts);
    },

    // TODO: Handle events from clients...
  },
  async (sock: SocketIO.Socket) => {
    const coxswainID = await config.data.coxswainID;
    sock.emit('coxswainID', coxswainID);
  }
);

remoteControlServer.linkObservable('tunnel', config.data.tunnel);
remoteControlServer.linkObservable('webui', config.data.webUIOptions);
remoteControlServer.linkObservable('upstream', config.data.upstreams);

// TODO: Link each upstream's status...

function Shutdown() {
  setImmediate(() => {
    // Shutdown remote control server
    remoteControlServer.close();
    config.close();

    // Just kill the process in a short time in case we've forgotten to stop something...
    setTimeout(() => {
      debug.error('Something is still running...');
      debug.warn('Forcing a shutdown.');
      process.exit(0);
    }, 100).unref();
  });
}

const endpoint = Endpoint();
const tunnel = Tunnel();

config.data.tunnel.subscribe(opts => {
  const server = http.createServer();
  ServerStarter(server, hookServerOptions, serverStartup('Hook'));
  endpoint.attach(server);

  tunnel.newTunnel(hookServerListen, opts);
});

config.data.webUIOptions.subscribe(opts => {
  const server = http.createServer();
  ServerStarter(server, opts, serverStartup('Client'));
  remoteControlServer.attach(server);
});

config.data.upstreams.subscribe(async ([upstreamID, upstreamConfig]) => {
  const coxswainID = await config.data.coxswainID;

  const hookUrl = tunnel.url.pipe(map(url => [url, '_coxswain', coxswainID, upstreamID].join('/')));

  const upstream = Upstream(upstreamConfig, hookUrl);

  const hookPath = hookUrl.pipe(map(url => new URL(url).pathname));

  endpoint.registerMiddleware(hookPath, upstream.middleware);
});

// For debugging
tunnel.url.subscribe(debug.variable.bind(0, 'Tunnel URL'));
config.data.coxswainID.then(debug.variable.bind(0, 'Coxswain ID'));
