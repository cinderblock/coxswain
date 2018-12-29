import React, { useState, useEffect } from 'react';

import { Button, ButtonGroup } from 'reactstrap';

import SocketConnection, { notify } from './SocketConnection';
import Authentication from './Authentication';
import Coxswain from './Coxswain';

export default function AppContainer(props: any) {
  return <Coxswain />;
}
