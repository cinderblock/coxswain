import fs from 'fs';
import util from 'util';

const authFile = 'auth.txt';

export default function auth() {
  let saved: string | undefined;

  fs.readFile(authFile, (err, buff) => {
    if (!err) saved = buff.toString();
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
  };
}
