import fs from 'fs';
import { Observable, Observer, Subscriber } from 'rxjs';
import { ServerStarterOptions } from 'server-starter';
import util from 'util';
import uuidv4 from 'uuid/v4';

import { TunnelOptions } from './TunnelHandler';
import { UpstreamOptions } from './UpstreamHandler';

const backendFile = 'data.json';

type uuid = string;

type StoredData = {
  // UUID identifying this instance of coxswain
  coxswainID?: uuid;
  webUIListen?: ServerStarterOptions | ServerStarterOptions[] | false;
  tunnel?: TunnelOptions;
  // Upstreams use their uuid as a key in a map
  upstreams?: { [id: string]: UpstreamOptions };
};

type RunningData = {
  coxswainID: Promise<uuid>;
  webUIListen: Observable<ServerStarterOptions>;
  tunnel: Observable<TunnelOptions>;
  // list of new upstreams
  upstreams: Observable<[uuid, UpstreamOptions]>;
};

function usePromise<T>(): [Promise<T>, (v: T) => any] {
  let res: (v: T) => any = () => {
    throw Error('Resolver not yet set');
  };
  const p = new Promise<T>(r => (res = r));
  return [p, res];
}

function useObservable<T>(): [Observable<T>, Observer<T>] {
  let sub: Observer<T> = new Subscriber<T>();
  const o = new Observable<T>(s => Object.assign(sub, s));
  return [o, sub];
}

export default function Config() {
  const [coxswainID, setID] = usePromise<string>();
  const [webUIListen, setUIListen] = useObservable<ServerStarterOptions>();
  const [tunnel, setTunnel] = useObservable<TunnelOptions>();
  const [upstreams, setUpstream] = useObservable<[uuid, UpstreamOptions]>();

  const data: RunningData = {
    coxswainID,
    webUIListen,
    tunnel,
    upstreams,
  };

  let saved: StoredData = {};

  fs.readFile(backendFile, (err, buff) => {
    if (!err) {
      try {
        saved = JSON.parse(buff.toString());
      } catch (e) {
        err = e;
      }
    }

    if (saved.coxswainID === undefined) {
      saved.coxswainID = uuidv4() as uuid;
      save();
    }

    setID(saved.coxswainID);
    setTunnel.next(saved.tunnel);

    if (saved.webUIListen === undefined) {
      setUIListen.next({ listen: 9001 });
    } else if (saved.webUIListen !== false) {
      if (!Array.isArray(saved.webUIListen)) setUIListen.next(saved.webUIListen);
      else saved.webUIListen.forEach(setUIListen.next);
    }

    if (saved.upstreams) {
      for (const upstreamId in saved.upstreams) {
        setUpstream.next([upstreamId, saved.upstreams[upstreamId]]);
      }
    }
  });

  function newUpstream(config: UpstreamOptions) {
    const id = uuidv4();
    if (!saved.upstreams) saved.upstreams = {};
    saved.upstreams[id] = config;
    setUpstream.next([id, config]);
    return save();
  }

  function newTunnel(config: TunnelOptions) {
    saved.tunnel = config;
    setTunnel.next(config);
    return save();
  }

  function newWebUI(config: ServerStarterOptions) {
    if (!saved.webUIListen) {
      saved.webUIListen = config;
    } else {
      if (Array.isArray(saved.webUIListen)) saved.webUIListen.push(config);
      else saved.webUIListen = [saved.webUIListen, config];
    }

    setUIListen.next(config);

    return save();
  }

  async function save() {
    // Make sure we've loaded data before we save
    await data.coxswainID;

    return util.promisify(fs.writeFile)(backendFile, JSON.stringify(saved, null, 2));
  }

  return {
    data,
    save,
    newUpstream,
    newTunnel,
    newWebUI,
  };
}
