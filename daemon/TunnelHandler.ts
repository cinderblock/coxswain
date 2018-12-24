const ngrok = require('ngrok');

export default function(port: number) {
  const URL = ngrok.connect(port);

  function url() {
    return URL;
  }

  return { url };
}
