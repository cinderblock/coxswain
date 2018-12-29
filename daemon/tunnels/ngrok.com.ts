import ngrok from 'ngrok';
import { Observable } from 'rxjs';

export type NgrokOptions = ngrok.INgrokOptions;

export default function(dest: number | string, options?: NgrokOptions) {
  if (typeof dest === 'string') throw new Error('unix sockets not supported by ngrok');

  if (!options) options = {};
  options.addr = dest;

  return new Observable(obs => {
    let ngrokUrl: string | undefined;

    ngrok.connect(options).then(url => obs.next((ngrokUrl = url)));

    return () => {
      if (!ngrokUrl) throw Error('Not connected!');

      ngrok.disconnect(ngrokUrl);
    };
  });
}
