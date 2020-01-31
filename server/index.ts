import { Server } from "@dataform/server/service";
import * as express from "express";
import * as yargs from "yargs";

const args = yargs
  .option("http-port", { default: 9110 })
  .option("grpc-proxy-port", { default: 9111 })
  .option("grpc-port", { default: 9112 })
  .option("project-dir", { type: "string", required: true }).argv;

const expressServer = express();
expressServer.use("/", express.static(__dirname + "/client"));
expressServer.listen(args["http-port"]);

const grpcServer = new Server(
  args["grpc-port"],
  args["grpc-proxy-port"],
  args["project-dir"],
  async () => {
    await grpcServer.shutdown();
    process.exit();
  }
);

grpcServer.start();
