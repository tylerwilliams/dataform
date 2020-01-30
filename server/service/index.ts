import * as Service from "@dataform/server/service/grpc_service";
import { ServiceImpl } from "@dataform/server/service/service_impl";
import * as grpc from "grpc";

export class Server {
  private readonly server: grpc.Server;

  public constructor(private port: number) {
    this.server = new grpc.Server();
  }

  public start() {
    this.server.addService(
      Service.DEFINITION,
      new Service.ServicePromiseWrapper(new ServiceImpl())
    );

    this.server.bind(`0.0.0.0:${this.port}`, grpc.ServerCredentials.createInsecure());
    this.server.start();
  }

  public async shutdown() {
    this.server.forceShutdown();
  }
}
