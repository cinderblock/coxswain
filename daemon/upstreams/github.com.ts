import GithubWebhook from 'koa-github-webhook-secure';
import { Observable } from 'rxjs';
import parse from 'url-parse';
import uuid from 'uuid/v4';

import Tunnel from '../tunnels/Tunnel';
import debug from '../utils/debug';

type uuid = string;

export type GithubUpstream = {
  service: 'github.com';
  // Most services require some key to access hook configuration
  token?: string;
  // List of repositories we're managing (on this github upstream)
  repositories?: {
    owner: string;
    name: string;
    instances?: {
      branch: string;
    }[];
    // github hook id. To easily reuse old hooks
    hookID?: string;
  }[];
};

let running = false;
export default async function newConnection(endpoint: Observable<string>, options: GithubUpstream) {
  if (
    !options.token ||
    !options.repositories ||
    !options.repositories[0] ||
    !options.repositories[0].owner ||
    !options.repositories[0].name ||
    !options.repositories[0].instances ||
    !options.repositories[0].instances[0]
  ) {
    debug.error('Missing options');
    return;
  }

  if (options.service !== 'github.com') {
    debug.error('Only github.com is supported currently');
    return;
  }

  if (running) {
    debug.error('Trying to run twice...');
    return;
  }
  running = true;

  const { owner, name, instances } = options.repositories[0];
  const { branch, hookID } = instances[0];

  const secret = uuid();
  const runID = uuid();

  const fullUrl = [endpoint.subscribe, runID].join('/');

  const path = parse(fullUrl).pathname;

  console.log('setting up hook');

  // Create a new hook middleware
  const githubWebhook = new GithubWebhook({ path, secret });

  // Attach it to Koa hook server
  hooks.use(githubWebhook.middleware());

  githubWebhook.on('*', console.log);
  githubWebhook.on('push', runInstance());

  // Register hook with github
  gh.registerHook(owner, name, fullUrl, secret);

  hooks.use(async ctx => {
    console.log('test');
    ctx.body = 'Hello';
    // TODO: Don't have this hook.use here
  });

  // TODO: Handle shutdown somehow...

  running = false;
}
