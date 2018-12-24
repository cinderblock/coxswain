import * as Octokit from '@octokit/rest';

const octokit = new Octokit();

export default function github(token: string) {
  async function getRepositoryList() {
    octokit;
  }

  return {
    getRepositoryList,
  };
}
