import * as fs from 'fs';
import * as util from 'util';

const authFile = 'auth.txt';

export default function auth() {
  let saved: string | undefined;
  let loaded = new Promise(resolve => {
    fs.readFile(authFile, (err, buff) => {
      if (err) return resolve(false);
      saved = buff.toString();
      resolve(true);
    });
  });

  function get() {
    return saved;
  }

  async function save(token: string) {
    saved = token;
    return util.promisify(fs.writeFile)(authFile, saved);
  }

  return {
    get,
    save,
    loaded,
  };
}
