import * as dfapi from "@dataform/api";
import * as dbadapters from "@dataform/api/dbadapters";
import * as dfcore from "@dataform/core";
import { dataform as protos } from "@dataform/protos";
import { Service } from "@dataform/server/service/grpc_service";
import { writeFile } from "fs";
import * as grpc from "grpc";
import { join, resolve } from "path";
import { promisify } from "util";

export class ServiceImpl implements Service {
  constructor(private readonly projectDir: string, private onShutdown: () => void) {}
  public async metadata(
    call: grpc.ServerUnaryCall<protos.server.IEmpty>
  ): Promise<protos.server.IMetadataResponse> {
    return {
      projectDir: this.projectDir
    };
  }

  public async compile(
    call: grpc.ServerUnaryCall<protos.server.IEmpty>
  ): Promise<protos.server.ICompileResponse> {
    return {
      graph: await dfapi.compile({
        projectDir: this.projectDir
      })
    };
  }

  public async initialize(
    call: grpc.ServerUnaryCall<protos.server.IInitializeRequest>
  ): Promise<protos.server.IInitializeResponse> {
    await dfapi.init(this.projectDir, call.request.projectConfig || {});
    await promisify(writeFile)(
      join(this.projectDir, dfapi.credentials.CREDENTIALS_FILENAME),
      JSON.stringify(call.request.bigquery)
    );
    return { directory: this.projectDir };
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
