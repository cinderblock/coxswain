import React, { useState, useEffect } from 'react';

import { Button, ButtonGroup } from 'reactstrap';

// Fix React ES6 class issues
// import reactAutoBind from 'react-autobind';

import SocketConnection, { notify } from './SocketConnection';
import Authentication from './Authentication';
import Coxswain from './Coxswain';

export default function AppContainer(props: any) {
  const [authorized, setAuthorized] = useState<undefined | boolean>(undefined);

  useEffect(notify('authorized', setAuthorized));

  if (authorized === undefined) {
    return <>Waiting for status...</>;
  }

  if (authorized === false) {
    return <Authentication />;
  }

  return <Coxswain />;
}
