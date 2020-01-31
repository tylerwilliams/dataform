import * as dfapi from "@dataform/api";
import * as dbadapters from "@dataform/api/dbadapters";
import * as dfcore from "@dataform/core";
import { dataform as protos } from "@dataform/protos";
import { Service } from "@dataform/server/service/grpc_service";
import { writeFile } from "fs";
import * as grpc from "grpc";
import { join } from "path";
import { promisify } from "util";

export class ServiceImpl implements Service {
  constructor(private readonly directory: string, private onShutdown: () => void) {}

  public compile(
    call: grpc.ServerUnaryCall<protos.server.IEmpty>
  ): Promise<protos.server.ICompileResponse> {
    throw new Error("Method not implemented.");
  }
  public projectState(
    call: grpc.ServerUnaryCall<protos.server.IEmpty>
  ): Promise<protos.server.IProjectStateResponse> {
    throw new Error("Method not implemented.");
  }
  public async initialize(
    call: grpc.ServerUnaryCall<protos.server.IInitializeRequest>
  ): Promise<protos.server.IEmpty> {
    await dfapi.init(this.directory, {});
    return {};
  }

  public async initializeCredentials(
    call: grpc.ServerUnaryCall<protos.server.IInitializeCredentialsRequest>
  ): Promise<protos.server.IEmpty> {
    await promisify(writeFile)(
      join(this.directory, dfapi.credentials.CREDENTIALS_FILENAME),
      JSON.stringify(call.request.bigquery)
    );
    return {};
  }

  public async shutdown(
    call: grpc.ServerUnaryCall<protos.server.IEmpty>
  ): Promise<protos.server.IEmpty> {
    // Shutdown in 10ms.
    const _ = (async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      this.onShutdown();
    })();
    return {};
  }
}
