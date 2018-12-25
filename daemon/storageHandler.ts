import * as fs from 'fs';
import * as util from 'util';

const backendFile = 'data.json';

type StoredData = {
  token?: string;
  repository?: string;
};

export default function Storage() {
  let saved: StoredData | undefined;

  let loaded = new Promise(resolve => {
    fs.readFile(backendFile, (err, buff) => {
      if (err) return resolve(false);
      saved = JSON.parse(buff.toString()) as StoredData;
      resolve(true);
    });
  });

  function get() {
    return saved;
  }

  async function save(data: StoredData) {
    Object.assign(saved, data);
    return util.promisify(fs.writeFile)(backendFile, JSON.stringify(saved));
  }

  return {
    get,
    save,
    loaded,
  };
}
