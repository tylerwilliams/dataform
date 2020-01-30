import { GrpcWebProxy } from "@dataform/grpc-web-proxy";
import { Server } from "@dataform/server/service";
import * as express from "express";
import * as yargs from "yargs";

const args = yargs
  .option("http-port", { default: 9110 })
  .option("grpc-proxy-port", { default: 9111 })
  .option("grpc-port", { default: 9112 })
  .option("project-dir", { required: true }).argv;

const grpcServer = new Server(args["grpc-port"]);

grpcServer.start();

// Also start the gRPC web proxy and serve the client application.

const grpcWebProxy = new GrpcWebProxy({
  backend: `http://localhost:${args["grpc-port"]}`,
  port: args["grpc-proxy-port"]
});

const expressServer = express();
expressServer.use("/", express.static(__dirname + "/client"));
expressServer.listen(args["http-port"]);
