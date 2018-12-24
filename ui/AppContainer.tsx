import React, { useState, useEffect } from 'react';

import { Button, ButtonGroup } from 'reactstrap';

// Fix React ES6 class issues
// import reactAutoBind from 'react-autobind';

import SocketConnection, { eventHandler } from './SocketConnection';

export default function AppContainer(props: any) {
  const [authorized, setAuthorized] = useState<undefined | boolean>(undefined);

  useEffect(() => {
    SocketConnection.on('noauth', () => {
      setAuthorized(false);
    });
  });

  if (authorized === undefined) {
    return <>Waiting for status...</>;
  }

  if (authorized === false) {
    return <>Get your token buddy...</>;
  }

  return <>Authorized!</>;

  return <Button onClick={eventHandler('hello') as any}>Hello world!</Button>;
}
