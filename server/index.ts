import { Server } from "@dataform/server/service";
import * as express from "express";
import { resolve } from "path";
import * as yargs from "yargs";

interface IServerProps {
  httpPort?: number;
  grpcPort?: number;
  grpcProxyPort?: number;
  projectDir: string;
}

export class DataformServer {
  private readonly props: IServerProps;
  constructor(props: IServerProps) {
    this.props = {
      grpcPort: 9112,
      grpcProxyPort: 9111,
      httpPort: 9110,
      ...props
    };
  }

  public start() {
    const expressServer = express();
    expressServer.use("/", express.static(resolve(__dirname, "client")));
    expressServer.listen(this.props.httpPort);
    expressServer.get("*", (req, res) => {
      res.sendFile(resolve(__dirname, "client", "index.html"));
    });

    const grpcServer = new Server(
      this.props.grpcPort,
      this.props.grpcProxyPort,
      this.props.projectDir,
      async () => {
        await grpcServer.shutdown();
        process.exit();
      }
    );

    grpcServer.start();
  }
}

if (require.main === module) {
  const args = yargs
    .option("http-port", { default: 9110 })
    .option("grpc-proxy-port", { default: 9111 })
    .option("grpc-port", { default: 9112 })
    .option("project-dir", { type: "string", required: true }).argv;

  const server = new DataformServer({
    grpcPort: args["grpc-port"],
    grpcProxyPort: args["grpc-proxy-port"],
    httpPort: args["http-port"],
    projectDir: args["project-dir"]
  });

  server.start();
}
