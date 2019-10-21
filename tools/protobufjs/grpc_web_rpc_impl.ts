import { grpc } from "grpc-web-client";
import { Method, RPCImpl, RPCImplCallback } from "protobufjs";

/**
 * A protobufjs rpc implementation for talking to grpc-web backends.
 */
export function rpcImpl(host: string, serviceName: string): RPCImpl {
  const makeGrpcCall = async (
    method: Method,
    requestData: Uint8Array,
    callback: RPCImplCallback
  ) => {
    grpc.unary(new UnaryMethod(method.name, { serviceName }), {
      request: new ProtobufMessageBytes(requestData),
      host,
      onEnd: output => {
        if (output.status === grpc.Code.OK) {
          callback(null, output.message.serializeBinary());
        } else {
          callback(new Error(output.statusMessage));
        }
      }
    });
  };

  return (method: Method, requestData: Uint8Array, callback: RPCImplCallback) =>
    makeGrpcCall(method, requestData, callback).catch(e => callback(e));
}

class ProtobufMessageBytes implements grpc.ProtobufMessage {
  public static deserializeBinary(bytes: Uint8Array): ProtobufMessageBytes {
    return new ProtobufMessageBytes(bytes);
  }
  private bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  public toObject(): {} {
    return {};
  }

  public serializeBinary(): Uint8Array {
    return this.bytes;
  }
}

class UnaryMethod
  implements grpc.UnaryMethodDefinition<ProtobufMessageBytes, ProtobufMessageBytes> {
  // TODO: Work out the typing here.
  public requestStream = false as any;
  public responseStream = false as any;
  public requestType = ProtobufMessageBytes as any;
  public responseType = ProtobufMessageBytes as any;

  public methodName: string;
  public service: grpc.ServiceDefinition;

  constructor(methodName: string, service: grpc.ServiceDefinition) {
    this.methodName = methodName;
    this.service = service;
  }
}
