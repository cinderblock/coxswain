import http from 'http';
import Koa from 'koa';
import Router from 'koa-router';
import { Observable } from 'rxjs';

export default function EndpointHandler(server: http.Server) {
  const app = new Koa();

  server.on('request', app.callback());

  const router = new Router();

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(async ctx => {
    console.log('Unhandled event?');
    ctx.body = 'Hello';
    // TODO: 404 Error instead?
  });

  return {
    registerMiddleware(url: Observable<string>, middleware: Koa.Middleware) {
      return url.subscribe(url => {
        router.use(url, middleware);
      });
    },
  };
}
