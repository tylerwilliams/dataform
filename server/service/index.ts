import * as Service from "@dataform/server/service/grpc_service";
import { ServiceImpl } from "@dataform/server/service/service_impl";
import { GrpcWebProxy } from "df/tools/grpc-web-proxy";
import * as grpc from "grpc";
import * as yargs from "yargs";

export class Server {
  private readonly server: grpc.Server;
  private grpcProxy: GrpcWebProxy;

  public constructor(
    private port: number,
    private proxyPort: number,
    private projectDir: string,
    private onShutdown: () => void
  ) {
    this.server = new grpc.Server();
  }

  public start() {
    this.server.addService(
      Service.DEFINITION,
      new Service.ServicePromiseWrapper(new ServiceImpl(this.projectDir, this.onShutdown))
    );

    this.server.bind(`0.0.0.0:${this.port}`, grpc.ServerCredentials.createInsecure());
    this.server.start();

    // Also start the gRPC web proxy and serve the client application.

    this.grpcProxy = new GrpcWebProxy({
      backend: `http://localhost:${this.port}`,
      port: this.proxyPort
    });
  }

  public async shutdown() {
    this.server.forceShutdown();
    this.grpcProxy.shutdown();
  }
}

if (require.main === module) {
  const args = yargs
    .option("grpc-proxy-port", { default: 9111 })
    .option("grpc-port", { default: 9112 })
    .option("project-dir", { type: "string", required: true }).argv;

  const grpcServer = new Server(
    args["grpc-port"],
    args["grpc-proxy-port"],
    args["project-dir"],
    () => ({})
  );

  grpcServer.start();
}
