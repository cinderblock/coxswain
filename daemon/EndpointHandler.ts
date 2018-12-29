import http from 'http';
import Koa from 'koa';
import Router from 'koa-router';
import { Observable } from 'rxjs';

export default function EndpointHandler() {
  const app = new Koa();

  const router = new Router();

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(async ctx => {
    console.log('Unhandled event?');
    ctx.body = 'Hello';
    // TODO: 404 Error instead?
  });

  return {
    attach(server: http.Server) {
      server.on('request', app.callback());
    },
    registerMiddleware(url: Observable<string>, middleware: Koa.Middleware) {
      return url.subscribe(url => {
        router.use(url, middleware);
      });
    },
  };
}
