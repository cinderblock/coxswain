import React, { useState, useEffect } from 'react';

import SocketConnection, { eventHandler } from './SocketConnection';

import scopes from './assets/Github-Scopes.png';

export default function Authentication(props: any) {
  function handleNewToken(event: any) {
    if (!(event.target.value as string).match(/^[0-9a-f]{40}$/)) return;

    eventHandler('token')(event.target.value);
  }

  return (
    <div>
      <h3>Go to Github and generate a new "Personal Access Token"</h3>
      <p>
        <a href="https://github.com/settings/tokens/new">new token</a>
      </p>
      <p>
        <img src={scopes} />
      </p>
      <h3>Input token:</h3>
      <input type="text" onChange={handleNewToken} maxLength={40} size={40} />
      <p>
        Looks like:
        <pre>4e726a19e66f51a16dd7aa63e6b1a1e901be4225</pre>
      </p>
    </div>
  );
}
