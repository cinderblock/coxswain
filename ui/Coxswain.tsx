import React, { useState, useEffect } from 'react';
import SocketConnection, { eventHandler, useStore } from './SocketConnection';
import Tunnel from './ConfigTunnel';
import Client from './ConfigClient';

export default function Coxswain(props: any) {
  return (
    <>
      <Tunnel />
      <Client />
    </>
  );
}
