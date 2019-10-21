import * as dfapi from "@dataform/api";
import * as dbadapters from "@dataform/api/dbadapters";
import * as dfcore from "@dataform/core";
import { Service } from "@dataform/server/service/grpc_service";
import * as grpc from "grpc";

export class ServiceImpl implements Service {
  public initialize(call: grpc.ServerUnaryCall<any>): Promise<any> {
    throw new Error("Method not implemented.");
  }
  public initializeCredentials(call: grpc.ServerUnaryCall<any>): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
