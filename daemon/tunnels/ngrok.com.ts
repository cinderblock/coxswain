import ngrok from 'ngrok';
import { Observable } from 'rxjs';
import uuid from 'uuid/v4';

export default function(prefix: string, options: ngrok.INgrokOptions | number) {
  return new Observable(sub => {
    let ngrokUrl: string | undefined;

    ngrok
      .connect(options)
      .then(url => (ngrokUrl = url))
      .then(url => [url, prefix, '__coxswain', uuid()].join('/'))
      .then(sub.next);

    return () => {
      if (!ngrokUrl) throw Error('Not connected!');

      ngrok.disconnect(ngrokUrl);
    };
  });
}
