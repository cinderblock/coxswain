import { Observable } from 'rxjs';
import Tunnel from './tunnels/tunnel';

export default function EndpointManager(tunnel: Tunnel) {
  return {
    async getEndpoint() {
      return new Observable(subscriber => {
        tunnel.url.then(subscriber.next);
        return () => {
          // Cleanup stuff here
        };
      });
    },
  };
}
