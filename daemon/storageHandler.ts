import fs from 'fs';
import util from 'util';
import uuidv4 from 'uuid/v4';

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
      if (!err) {
        try {
          saved = JSON.parse(buff.toString()) as StoredData;
        } catch (e) {
          err = e;
        }
      }

      if (err || saved === undefined) saved = {};

      if (saved.instanceID === undefined) {
        save({ instanceID: uuidv4() });
      }

      resolve(!err);
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
