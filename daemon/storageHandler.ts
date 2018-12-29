import fs from 'fs';
import { ServerStarterOptions } from 'server-starter';
import util from 'util';
import uuidv4 from 'uuid/v4';

import { UpstreamOptions } from './UpstreamHandler';

const backendFile = 'data.json';

type uuid = string;

type StoredData = {
  // UUID identifying this instance of coxswain
  coxswainID?: uuid;
  webUIListen?: ServerStarterOptions | false;
  tunnel?: {
    provider: 'ngrok.com';
    options: any;
  };
  // Support more than one upstream
  // Currently only github supported
  upstreams?: { [id: string]: UpstreamOptions };
};

type AvailableData = {
  // UUID identifying this instance of coxswain
  coxswainID: uuid;
  webUIListen?: ServerStarterOptions | false;
  tunnel?: {
    provider: 'ngrok.com';
    options: any;
  };
  // Support more than one upstream
  // Currently only github supported
  upstreams?: { [id: string]: UpstreamOptions };
};

export default function Storage() {
  const data = new Promise<AvailableData>(resolve => {
    fs.readFile(backendFile, (err, buff) => {
      let saved: StoredData | undefined;
      if (!err) {
        try {
          saved = JSON.parse(buff.toString()) as StoredData;
        } catch (e) {
          err = e;
        }
      }

      let needsSave = false;

      if (saved === undefined) saved = {};

      if (saved.coxswainID === undefined) {
        saved.coxswainID = uuidv4() as uuid;
        needsSave = true;
      }

      resolve(saved as AvailableData);

      if (needsSave) save();
    });
  });

  async function save() {
    return util.promisify(fs.writeFile)(backendFile, JSON.stringify(await data));
  }

  return {
    data,
    save,
  };
}
