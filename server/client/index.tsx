import Initialize from "df/server/client/initialize";
import { Overview } from "df/server/client/overview";
import { Service } from "df/server/client/service";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Route } from "react-router";
import { BrowserRouter } from "react-router-dom";

const service = Service.get();

async function render() {
  const metadata = await service.metadata({});
  ReactDOM.render(
    <BrowserRouter>
      <Route
        path={"/init"}
        component={(props: any) => <Initialize {...props} service={service} metadata={metadata} />}
      />
      <Route
        path={"/"}
        exact={true}
        component={(props: any) => <Overview {...props} service={service} metadata={metadata} />}
      />
    </BrowserRouter>,
    document.getElementById("root")
  );

  // Hide the loader animation immediately for non-init pages.
  if (!window.location.pathname.startsWith("/init")) {
    document.getElementById("preloader").style.display = "none";
  }
}

const _ = render();
