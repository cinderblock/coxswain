import Octokit, { Response } from '@octokit/rest';
import { Middleware } from 'koa';
import GithubWebhook from 'koa-github-webhook-secure';
import Router from 'koa-router';
import { Observable } from 'rxjs';
import { URL } from 'url';
import uuid from 'uuid/v4';

import { RuntimeOptions } from '../RunHandler';
import debug from '../utils/debug';

type uuid = string;

export type GithubUpstreamOptions = {
  service: 'github.com';
  token: string;
  // List of repositories we're managing (on this github upstream)
  repositories?: {
    owner: string;
    name: string;
    instances?: {
      branch: string;
      options?: RuntimeOptions;
    }[];
    // github hook id. To easily reuse old hooks
    hookID?: string;
  }[];
};

type Repository = Octokit.AppsListReposResponseRepositoriesItem;

let running = false;
export default function(config: GithubUpstreamOptions, hookUrl: Observable<string>): { middleware: Middleware } {
  if (config.service !== 'github.com') throw new Error('Only github.com is supported by this file');

  if (!config.token) throw new Error('Missing token');

  const octokit = new Octokit();
  const router = new Router();
  let repos: Repository[] | false | undefined;

  octokit.authenticate({ type: 'token', token: config.token });

  async function getRepositoryList() {
    return depaginate(octokit.repos.list);
  }

  async function getHooks(owner: string, repo: string) {
    const opts: Octokit.ReposListHooksParams = { owner, repo };
    return depaginate(octokit.repos.listHooks, opts);
  }

  async function registerHook(owner: string, repo: string, url: string, secret: string, hookID?: number) {
    return octokit.repos.createHook({
      owner,
      repo,
      name: 'web',
      config: { content_type: 'json', url, secret },
      events: ['push'],
      active: true,
    });
  }

  hookUrl.subscribe(function updateHookUrl(url: string) {
    if (!config.repositories) {
      debug.warn('No repos configured');
      return;
    }

    for (const repo of config.repositories) {
      if (!repo.instances) continue;

      const { owner, name, instances, hookID } = repo;

      const repoRunID = uuid();
      const secret = uuid();

      const fullUrl = [url, repoRunID].join('/');

      const path = new URL(fullUrl).pathname;

      // Create a new hook middleware
      const githubWebhook = new GithubWebhook({ path, secret });
      githubWebhook.on('ping', console.log);

      // TODO: Figure out running...
      // githubWebhook.on('push', runInstance());

      router.use(path, githubWebhook.middleware());

      // Register hook with github
      registerHook(owner, name, fullUrl, secret);

      for (const instance of instances) {
        const { branch } = instance;
      }
    }
  });

  // TODO: Handle shutdown somehow...

  return {
    middleware: router.routes(),
  };
}

async function depaginate<T, O extends { per_page?: number; page?: number }>(
  func: (options: O) => Promise<Response<Array<T>>>,
  options: O = <O>{} // TODO: figure out if `<O>`/`as O` is correct way to do this
) {
  const list: T[] = [];
  try {
    let i = 1;
    // max of 100 per API
    if (options.per_page === undefined || !(0 < options.per_page && options.per_page <= 100)) options.per_page = 100;
    // Just in case
    const maxPages = 200;
    while (i < maxPages) {
      options.page = i++;
      const result = await func(options);
      const next = result.data;

      // Just in case and handy shortcut
      if (!next || !next.length) break;

      // list = list.concat(next);
      list.splice(list.length, 0, ...next);

      // If we got fewer than the max length, we're at the end of the list
      if (next.length < options.per_page) break;
    }
    return list;
  } catch (e) {
    // Some other error
    if (list.length !== 0) return list;

    // Github sometimes responds with 404 to mean unauthorized
    if (e.status === 404) return false;
    // Sometimes responds with 401
    if (e.status === 401) return false;

    console.log(e);

    throw e;
  }
}
