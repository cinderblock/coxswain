import fs from 'fs';
import util from 'util';
import uuidv4 from 'uuid/v4';

const backendFile = 'data.json';

type uuid = string;

type GithubUpstream = {
  service: 'github.com';
  // Most services require some key to access hook configuration
  token?: string;
  // List of repositories we're managing (on this upstream)
  repositories?: {
    owner: string;
    name: string;
    instances?: {
      branch: string;
      // host hook id. To easily reuse old hooks
      hookID?: string;
    }[];
  }[];
};

type StoredData = {
  // UUID identifying this instance of coxswain
  coxswainID?: uuid;
  // Support more than one upstream
  // Currently only github supported
  upstreams?: GithubUpstream[];
};

export default function Storage() {
  let saved: StoredData | undefined;

  let loaded = new Promise(resolve => {
    fs.readFile(backendFile, (err, buff) => {
      if (!err) {
        try {
          saved = JSON.parse(buff.toString()) as StoredData;
        } catch (e) {
          err = e;
        }
      }

      if (saved === undefined) saved = {};

      resolve(!err);

      if (saved.coxswainID === undefined) {
        saved.coxswainID = uuidv4();
        save();
      }
    });
  });

  function get() {
    return saved;
  }

  async function save() {
    // Make sure we've loaded the file before we try to save to it
    await loaded;

    return util.promisify(fs.writeFile)(backendFile, JSON.stringify(saved));
  }

  return {
    get,
    save,
    loaded,
  };
}
