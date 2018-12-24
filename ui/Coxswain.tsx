import React, { useState, useEffect } from 'react';
import SocketConnection, { eventHandler, notify } from './SocketConnection';

import { Repository } from '../daemon/githubHandler';

function repository(repo: Repository, index: number) {
  return (
    <li
      key={index}
    >
      {repo.full_name}
    </li>
  );
}

export default function Coxswain(props: any) {
  const [repolist, setRepolist] = useState<Repository[]>([]);

  useEffect(notify('repositories', setRepolist));

  return <ul>{repolist && repolist.map(repository)}</ul>;
}
