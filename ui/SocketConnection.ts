import io from 'socket.io-client';

// config
const socketURL = (undefined as unknown) as string;

const socket = io(socketURL, {
  transports: ['websocket'],
});

socket.on('error', console.log.bind(0, 'Error:'));

type Stored<T> = { setState?: React.Dispatch<React.SetStateAction<T>>; value?: T };

const Store: { [x: string]: Stored<any> } = {};

function updateStore(index: string, value: any) {
  // console.log('Update:', index, '-', value);
  if (!Store[index]) Store[index] = { value };
  else Store[index].value = value;

  const setState = Store[index].setState;
  if (setState) setState(value);
}

function linkStore(index: string) {
  socket.on(index, (u: any) => updateStore(index, u));
}

linkStore('startuptime');
linkStore('authorized');
linkStore('repositories');

function notify(index: string, setState: React.Dispatch<React.SetStateAction<any>>) {
  return function() {
    if (!Store[index]) Store[index] = { setState };
    else {
      Store[index].setState = setState;
      setState(Store[index].value);
    }

    return function denotify() {
      Store[index].setState = undefined;
    };
  };
}

window.addEventListener('deviceorientation', ({ alpha, beta, gamma }) => {
  if (alpha === null) return;

  socket.emit('event', { name: 'deviceorientation', value: { alpha, beta, gamma } });
});

const eventHandlers: { [x: string]: Function } = {};

// caches event handlers
function eventHandler(name: string, log = true) {
  if (eventHandlers[name]) return eventHandlers[name];

  return (eventHandlers[name] = (value: any) => {
    if (
      typeof value != 'number' &&
      typeof value != 'string' &&
      value &&
      value.target &&
      value.target.value !== undefined
    ) {
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

export { socket as default, eventHandler, Store, notify };
