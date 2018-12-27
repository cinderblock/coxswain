import React, { useState, useEffect } from 'react';
import SocketConnection, { eventHandler, useStore } from './SocketConnection';

import { Repository } from '../daemon/githubHandler';

function repository(repo: Repository, index: number) {
  return (
    <li
      key={index}
      onClick={event => {
        eventHandler('selectRepo')(repo);
      }}
    >
      {repo.full_name}
    </li>
  );
}

export default function Coxswain(props: any) {
  const [repoList, foo] = useStore<Repository[]>('repositories', []);

  return <ul>{repoList && repoList.map(repository)}</ul>;
}
