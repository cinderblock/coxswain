import Octokit from '@octokit/rest';

export type Repository = Octokit.AppsListReposResponseRepositoriesItem;

export default function github() {
  const octokit = new Octokit();

  function authorize(token: string) {
    octokit.authenticate({ type: 'token', token });
  }

  async function depaginate<T>(func: Function, options: any = { per_page: 100 }) {
    const list: T[] = [];
    try {
      let i = 1;
      // max of 100 per API
      if (!(0 < options.per_page && options.per_page <= 100)) options.per_page = 100;
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

  async function getRepositoryList() {
    return depaginate<Repository>(octokit.repos.list);
  }

  async function getHooks(owner: string, repo: string) {
    const opts: Octokit.ReposListHooksParams = { owner, repo };
    return depaginate<Octokit.ReposListHooksResponseItem>(octokit.repos.listHooks, opts);
  }

  async function registerHook(owner: string, repo: string, url: string, secret: string) {
    return octokit.repos.createHook({
      owner,
      repo,
      name: 'web',
      config: { content_type: 'json', url, secret },
      events: ['push'],
      active: true,
    });
  }

  return {
    authorize,
    getRepositoryList,
    getHooks,
    registerHook,
  };
}
