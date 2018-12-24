import * as Octokit from '@octokit/rest';

const octokit = new Octokit();

export type Repository = Octokit.AppsListReposResponseRepositoriesItem;

export default function github(token: string) {
  octokit.authenticate({ type: 'token', token });

  async function getRepositoryList() {
    const list: Repository[] = [];
    let i = 1;
    // max of 100 per API
    const per_page = 100;
    const maxPages = 100;
    while (i < maxPages) {
      const oldLength = list.length;
      const next = (await octokit.repos.list({ per_page, page: i++ })).data;
      // list = list.concat(next);
      list.splice(-1, 0, ...next);

      // Either of the following checks should be sufficient.

      // If we haven't changed length
      if (list.length == oldLength) break;

      // If we got fewer than then max length
      if (next.length < per_page) break;
    }
    return list;
  }

  return {
    getRepositoryList,
  };
}
