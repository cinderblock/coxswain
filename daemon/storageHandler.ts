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

      if (saved === undefined) saved = {};

      resolve(!err);

      if (saved.instanceID === undefined) {
        save({ instanceID: uuidv4() });
      }
    });
  });

  function get() {
    return saved;
  }

  async function save(data: StoredData) {
    // Make sure we've loaded the file before we try to save to it
    await loaded;

    Object.assign(saved, data);
    return util.promisify(fs.writeFile)(backendFile, JSON.stringify(saved));
  }

  return {
    get,
    save,
    loaded,
  };
}
