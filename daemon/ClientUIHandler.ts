import chalk from 'chalk';
import http from 'http';
import os from 'os';
import { Observable } from 'rxjs';
import SocketIO from 'socket.io';

let clientID = 0;

export default function makeSocketIOServer(eventHandlers: { [x: string]: Function }, onNewClient?: Function) {
  // Helper function that is run every time a new webUI connects to us
  function setupClientSocket(sock: SocketIO.Socket) {
    const ID = clientID++;

    // TODO: Do we trust the proxy to set true `x-real-ip` header?
    const headers = sock.conn.request.headers;
    const address: string = headers['X-Forwarded-For'] || headers['x-real-ip'] || sock.handshake.address;
    console.log(chalk.green('Client connected:'), chalk.cyan(address));

    // Give clients a our startup time once
    sock.emit('startuptime', Date.now() - os.uptime() * 1000);

    // Don't listen to client events for a sec on startup.
    // Ignores events that were "sent" after server shutdown (and are therefore still pending)
    setTimeout(() => {
      sock.on('event', ({ name, value, log }) => {
        if (log)
          console.log(
            chalk.grey('Event:'),
            chalk.cyan(name),
            '-',
            chalk.magenta(value === undefined ? 'value undefined' : value)
          );
        const handler = eventHandlers[name];

        if (!handler) {
          console.log(chalk.red('No handler for event:'), chalk.magenta(name));
          return;
        }

        handler(value, ID);
      });
    }, 200);

    if (onNewClient) onNewClient(sock);

    for (const event in linkedObservables) {
      linkedObservables[event].subscribe(v => sock.emit(event, v));
    }
  }

  const sock = SocketIO({
    serveClient: false,
    transports: ['websocket'],
    pingInterval: 1000,
  });

  function attach(server: http.Server) {
    sock.attach(server);
  }

  const linkedObservables: { [event: string]: Observable<any> } = {};

  function linkObservable(event: string, o: Observable<any>) {
    linkedObservables[event] = o;
    o.subscribe(emitAll.bind(0, event));
  }

  // When a new client connects, setup handlers for the possible incoming commands
  sock.on('connection', setupClientSocket);

  // // Send regular updates to UI
  // setInterval(() => {
  //   sock.volatile.emit('update', {
  //     /* data */
  //   });
  // }, 1000 / 30); // at 30 Hz

  function emitAll(event: string, ...args: any) {
    sock.sockets.emit(event, ...args);
  }

  return { close: sock.close, on: sock.on, emitAll, attach, linkObservable };
}
