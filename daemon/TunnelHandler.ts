import ngrok from 'ngrok';
import uuid from 'uuid/v4';

export default function(port: number) {
  const URL = ngrok.connect(port);
  const id = uuid();

  function url() {
    return URL;
  }

  return { url, id };
}
