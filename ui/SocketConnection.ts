import io from 'socket.io-client';

// config
const socketURL = (undefined as unknown) as string;

const socket = io(socketURL, {
  transports: ['websocket'],
});

socket.on('error', console.log.bind(0, 'Error:'));

const Store: { startuptime?: number } = {};

socket.on('startuptime', (u: number) => (Store.startuptime = u));

window.addEventListener('deviceorientation', ({ alpha, beta, gamma }) => {
  if (alpha === null) return;

  socket.emit('event', { name: 'deviceorientation', value: { alpha, beta, gamma } });
});

const eventHandlers: { [x: string]: Function } = {};

// caches event handlers
function eventHandler(name: string, log = true) {
  if (eventHandlers[name]) return eventHandlers[name];

  return (eventHandlers[name] = (value: any) => {
    if (typeof value != 'number' && typeof value != 'string' && value) {
      value = value.target.value;
    }

    socket.emit('event', {
      name,
      value,
      log,
    });

    console.log('Event:', name, '->', value === undefined ? 'value undefined' : value);
  });
}

export { socket as default, eventHandler, Store };
