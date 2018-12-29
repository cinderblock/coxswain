import ngrok, { NgrokOptions } from './tunnels/ngrok.com';

type TunnelOptions =
  // Currently only ngrok is supported
  {
    service: 'ngrok.com';
    options?: NgrokOptions;
  };

/**
 * Create a new tunnel from options
 * @param dest Destination port (number) or unix socket (string)
 * @param options Tunnel host options
 */
export default function Tunnel(dest: number | string, options: TunnelOptions = { service: 'ngrok.com' }) {
  switch (options.service) {
    case 'ngrok.com':
      return ngrok(dest, options.options);
  }
}
