import { Observable, Subscriber } from 'rxjs';
import ngrok, { NgrokOptions } from './tunnels/ngrok.com';
import debug from './utils/debug';

export type TunnelOptions =
  // Currently only ngrok is supported
  | {
      service: 'ngrok.com';
      listen?: number;
      options?: NgrokOptions;
    }
  | undefined;

export default function Tunnel() {
  let obs: Subscriber<string>;

  const url = new Observable<string>(o => (obs = o));

  /**
   * Create a new tunnel from options
   * @param dest Destination port (number) or unix socket (string)
   * @param options Tunnel host options
   */
  function newTunnel(dest: number | string, options: TunnelOptions) {
    if (!options) options = { service: 'ngrok.com' };

    debug.info('new tunnel config');
    switch (options.service) {
      case 'ngrok.com':
        ngrok(dest, options.options).subscribe(url => obs.next);
    }
  }

  return {
    url,
    newTunnel,
  };
}
