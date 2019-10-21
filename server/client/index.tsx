import * as React from "react";
import * as ReactDOM from "react-dom";
import { Route } from "react-router";
import { BrowserRouter } from "react-router-dom";

import { dataform } from "@dataform/protos";
import { rpcImpl } from "@dataform/tools/protobufjs/grpc_web_rpc_impl";

export class ViewService extends dataform.server.Service {
  public static get(): ViewService {
    if (!ViewService.instance) {
      ViewService.instance = new ViewService();
    }
    return ViewService.instance;
  }
  private static instance: ViewService;

  constructor() {
    super(rpcImpl("http://localhost:8000", "ViewService"), false, false);
  }
}

ReactDOM.render(
  <BrowserRouter>
    <Route path={"/"} component={(props: any) => <div>hello workd</div>} />
  </BrowserRouter>,
  document.getElementById("root")
);
