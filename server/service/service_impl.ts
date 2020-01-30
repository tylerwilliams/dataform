import * as dfapi from "@dataform/api";
import * as dbadapters from "@dataform/api/dbadapters";
import * as dfcore from "@dataform/core";
import { dataform as protos } from "@dataform/protos";
import { Service } from "@dataform/server/service/grpc_service";
import * as grpc from "grpc";

export class ServiceImpl implements Service {
  public async initialize(
    call: grpc.ServerUnaryCall<protos.server.IInitializeRequest>
  ): Promise<protos.server.IEmpty> {
    return {};
  }

  public initializeCredentials(
    call: grpc.ServerUnaryCall<protos.server.IInitializeCredentialsRequest>
  ): Promise<protos.server.IEmpty> {
    throw new Error("Method not implemented.");
  }
}
