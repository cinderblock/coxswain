import React, { useState, useEffect } from 'react';
import SocketConnection, { eventHandler, notify } from './SocketConnection';

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
  const [repoList, setRepoList] = useState<Repository[]>([]);

  useEffect(notify('repositories', setRepoList));

  return <ul>{repoList && repoList.map(repository)}</ul>;
}
