import React, { useState, useEffect } from 'react';
import SocketConnection, { eventHandler, useStore } from './SocketConnection';

import { WebUIServerOptions } from '../daemon/ConfigHandler';

export default function Client(props: any) {
  const [tunnel] = useStore<WebUIServerOptions[]>('webui', []);

  return <div>{tunnel}</div>;
}
