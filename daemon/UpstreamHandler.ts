import { Middleware } from 'koa';
import { Observable } from 'rxjs';

import Github, { GithubUpstreamOptions } from './upstreams/github.com';

// Currently only github.com is supported
export type UpstreamOptions = GithubUpstreamOptions;

export default function Upstream(config: UpstreamOptions, hookUrl: Observable<string>): { middleware: Middleware } {
  switch (config.service) {
    case 'github.com':
      return Github(config, hookUrl);
  }

  // TODO: upstreams have many running instances... How to decouple properly...
}
