import fs from 'fs';
import util from 'util';
import uuid from 'uuid/v4';

const backendFile = 'data.json';

type StoredData = {
  token?: string;
  repository?: string;
  instanceID?: string;
};

export default function Storage() {
  let saved: StoredData | undefined;

  let loaded = new Promise(resolve => {
    fs.readFile(backendFile, (err, buff) => {
      if (err) return resolve(false);
      try {
        saved = JSON.parse(buff.toString()) as StoredData;
      } catch (e) {
        saved = {};
      }

      if (saved.instanceID === undefined) {
        save({ instanceID: uuid() });
      }

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
