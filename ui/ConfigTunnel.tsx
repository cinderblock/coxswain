import React, { useState, useEffect } from 'react';
import SocketConnection, { eventHandler, useStore } from './SocketConnection';

import { TunnelOptions } from '../daemon/TunnelHandler';

export default function Tunnel(props: any) {
  const [tunnel] = useStore<TunnelOptions[]>('tunnel', []);

  return <div>{tunnel}</div>;
}
