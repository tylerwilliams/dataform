import Initialize from "df/server/client/initialize";
import { Service } from "df/server/client/service";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Route } from "react-router";
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <BrowserRouter>
    <Route path={"/"} component={(props: any) => <Initialize></Initialize>} />
  </BrowserRouter>,
  document.getElementById("root")
);

Service.get().initialize({});

document.getElementById("preloader").style.display = "none";
