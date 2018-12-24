import * as Octokit from '@octokit/rest';

const octokit = new Octokit();

export type Repository = Octokit.AppsListReposResponseRepositoriesItem;

export default function github(token: string) {
  octokit.authenticate({ type: 'token', token });

  async function depaginate<T>(func: Function, options: any = {}) {
    const list: T[] = [];
    try {
      let i = 1;
      // max of 100 per API
      const per_page = 1;
      // Just in case
      const maxPages = 200;
      while (i < maxPages) {
        const oldLength = list.length;
        const next = (await func(Object.assign(options, { per_page, page: i++ }))).data;

        // Just in case and handy shortcut
        if (!next || !next.length) break;

        // list = list.concat(next);
        list.splice(list.length, 0, ...next);

        // If we got fewer than the max length, we're at the end of the list
        if (next.length < per_page) break;
      }
      return list;
    } catch (e) {
      // Some other error
      if (list.length !== 0) return list;

      // Github is very strict about security and returns 404 for anything
      if (e.status === 404) return false;

      throw e;
    }
  }

  async function getRepositoryList() {
    return depaginate<Repository>(octokit.repos.list);
  }

  async function getHooks(repo: Repository) {
    const opts: Octokit.ReposListHooksParams = { owner: repo.owner.login, repo: repo.name };
    return depaginate<Octokit.ReposListHooksResponseItem>(octokit.repos.listHooks, opts);
  }

  return {
    getRepositoryList,
    getHooks,
  };
}
