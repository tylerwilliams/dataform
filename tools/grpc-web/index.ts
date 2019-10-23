import * as http2 from "http2";

const grpcContentType = "application/grpc";
const grpcWebContentType = "application/grpc-web";
const grpcWebTextContentType = "application/grpc-web-text";

const fakeKey = `
-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDOM5GvEJ7FNJ9y
KPT8cp7uZw/MAYBJ5/MRDhsvu2UKIpzN0CSNDK2sY6Aiuf5kuxiEUbGO4D0F9kvv
M6QF0xnaO8sy19el5Dcw6X7Kx0OX6tl7Jb/HjHX378k1gfU6MTOmgk5EPdl9b3wm
xjG5e241n6q3yK7jhit97aM210h5efG2e4n/P5/oTmYBsJJmtZOHHFLDtRR5FeDw
N85nQl9vlQomOorWKhtEoY4ntmBjw4xbIb/Z/T/Wn0eoEsGdLxD6nPcSWRiASpVO
s4e/e6Toz9A6WIHhU6tLKrk5zBx52wN0DBZx87CMT4g45PriRJ7yEMOGrypfJpzW
Kk7PhebnAgMBAAECggEATDBDuPKkJ2t9Kno1ov1a+e18qb04QJaCeh/DLczI1Yja
dTVd+/veQ97/sTUV6PQ0Z9ejio4SHhzWC8kB5uEMIVWMi/myhWogdmMf5R7hO8Wb
m+Pjy4B7qiOgLbQZ/ullEzX8YzyTGsTRk6YRg14253taYdO1wv21Hi9q6f17mt4o
qSF+osyQpdfCfosvTWwCI6sboUK2UTpLqadNPtLfvHY/R2foi4Lpy5PnrjXvd1pe
rmcjn2Yy79J+ubTnPYBwUIJuk1oAjsBClmv09zhBOTKaBlQ0mTHkXtqU9rCDRStz
/5UWl0UNSmZ1ELapkn61ggK60R9oMSw8EM2eawrICQKBgQD1Y9ciLrI/ptpPx2Xe
UOCrLBcmAvWY/z0iiKm5f0o/AnbvoI248JNW9jqF5Hrlg6b7X33mkgSSRqiEOipT
Ev3kQthdIM+eYOqBEXd2bCscHA/3gSwzANglmnD+RZV7jX5u6+DgBOcslMdFkGrl
3LSsNvvtrD/7JYhLlXI0M+cBswKBgQDXHfXi1mLG35Wjf2IJkwWC9prps5/jH8Rf
bTNoM4aZWvc5ATpDPrSpPKJZS6Qf6Ud6QXLWPcV2vxw8Njq2w15fKvPAWo2Bg9T9
o8QtdJ/fS3d9Xyvq75hgsO/8zcd/IMp5VHMp3NnkGoHJEXWWBOSusU91bY/ZN08p
oPLOxKtj/QKBgQDgdKSR5bixtEM4eiFZywzWRYwe/tH7UmxvLCZjQGV/YRe9dFRt
99At2SgK1MT9LwEMKXqV7rYzvmHiIPoZ5uNJaUNTW/HM4sVdrcZiEesU2S5ZrFPr
izgqnSwByVBEJVaiyyt0fcee5a+ol8LP4qN4awrhiY80gE49JMPDsD37NQKBgQDK
lpSzBGQSFw6944FYsvVF2SkbXub85zXxCM6ZG61vT5P0Q4uzOKK7nzbmEa6HvxJp
uKmFyrbklibpLcktxeBij/ju9li92IIGPOzMQkEt8cyebbrWjr5akUfyNXnj5+XH
ThkHG864W55O1fp/Rix3uNS0KnKGhugutDz3LZCboQKBgQDBxIhAeT38d0WxYhsV
Nn+INN7UEXppHEtRm5GFDt8W4TRWG9oi+KzJ30ebN4NxbKo4h8rKi0ffzs3mqAD9
HZwWcG2OmuBhgeR5XGMjOG9124iEloStUIFkFdiF6wVMYb7qw7IHYOyQkcmIy30J
xVVcdOwM87DrGxpLWMG8sn3paQ==
-----END PRIVATE KEY-----
`;
const fakeCert = `
-----BEGIN CERTIFICATE-----
MIIC+jCCAeKgAwIBAgIUY3RqHKXewxDXHWhYu4CxwyRxrSMwDQYJKoZIhvcNAQEL
BQAwGTEXMBUGA1UEAwwObG9jYWxob3N0OjgwMDAwHhcNMTkxMDIzMDc1NzU5WhcN
MTkxMTIyMDc1NzU5WjAZMRcwFQYDVQQDDA5sb2NhbGhvc3Q6ODAwMDCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAM4zka8QnsU0n3Io9Pxynu5nD8wBgEnn
8xEOGy+7ZQoinM3QJI0MraxjoCK5/mS7GIRRsY7gPQX2S+8zpAXTGdo7yzLX16Xk
NzDpfsrHQ5fq2Xslv8eMdffvyTWB9ToxM6aCTkQ92X1vfCbGMbl7bjWfqrfIruOG
K33tozbXSHl58bZ7if8/n+hOZgGwkma1k4ccUsO1FHkV4PA3zmdCX2+VCiY6itYq
G0Shjie2YGPDjFshv9n9P9afR6gSwZ0vEPqc9xJZGIBKlU6zh797pOjP0DpYgeFT
q0squTnMHHnbA3QMFnHzsIxPiDjk+uJEnvIQw4avKl8mnNYqTs+F5ucCAwEAAaM6
MDgwFAYDVR0RBA0wC4IJbG9jYWxob3N0MAsGA1UdDwQEAwIHgDATBgNVHSUEDDAK
BggrBgEFBQcDATANBgkqhkiG9w0BAQsFAAOCAQEAk/8oB6Xm/mfDGt4Igt26brpg
olA7pfOUE2yE7xdLmu2E+L/R6Y8rzrasHlX4u/Eeipf3sSGvzdZVY0Ue5RVHu5Vi
S5LVD4gkzy+FivGPhiQpFfvnj2nG09rRiOhyFPtxa3ME4CV416QaDFN5WbLa9HYr
pLvh1kk+HaUNoQn1E83NwP7KQFPCUX7eFKRBox1OoMlvPGlN5utCVAYn3/RBd8zL
fECVjb9k5Fw91EVi8Ayk1KYuamyeNulR+pooQBlUydvtgEfmE90mCYzY0sfc1CsN
gdl7NoM6RHR6tJX4Q5PPbToGZNQbCtEOKxu4Iyn1DMFhowGb+Nk+WMSeLC7JcA==
-----END CERTIFICATE-----
`;

interface IOptions {
  port: number;
}

export class GrpcWebProxy {
  private webServer: http2.Http2Server;
  private grpcClient: http2.ClientHttp2Session;

  constructor(backend: string, private options: IOptions) {
    this.webServer = http2
      .createSecureServer({ key: fakeKey, cert: fakeCert })
      .listen(options.port);
    console.log("listening");
    this.webServer.on("stream", (stream, headers) => {
      console.log("onstream");
      this.handleGrpcWebRequest(stream, headers);
    });
    this.webServer.on("checkContinue", () => {
      console.log("oncheckcontinue");
    });
    // this.webServer.on("request", (request, headers) => {
    //   console.log("onrequest");
    //   // this.handleGrpcWebRequest(request, headers);
    // });
    this.grpcClient = http2.connect(backend);
    this.grpcClient.on("error", error => {
        console.log("ongrpcclienterror");
      console.log(error);
    });
    this.grpcClient.on("connect", () => {
        console.log("ongrpcclientconnect");
    });
    this.grpcClient.on("altsvc", () => {
        console.log("ongrpcclientaltsvc");
    })
    this.grpcClient.on("stream", () => {
        console.log("ongrpcclientstream");
    })
  }

  private handleGrpcWebRequest(
    webStream: http2.ServerHttp2Stream,
    webHeaders: http2.IncomingHttpHeaders
  ) {
    
    const contentType = webHeaders["content-type"] || grpcWebContentType;
    const incomingContentType = grpcWebContentType;
    const isTextFormat = contentType.startsWith(grpcWebTextContentType);
    if (isTextFormat) {
      console.log("istextformat");
      throw new Error("Unsupported");
    }

    const grpcRequestHeaders: http2.OutgoingHttpHeaders = { ...webHeaders };
    grpcRequestHeaders["content-type"] = contentType.replace(incomingContentType, grpcContentType);
    delete grpcRequestHeaders["content-length"];
    grpcRequestHeaders.ProtoMajor = 2;
    grpcRequestHeaders.ProtoMinor = 0;
    console.log(grpcRequestHeaders);

    try {
      const grpcRequest = this.grpcClient.request(grpcRequestHeaders);
      console.log("grpcrequestcreated");

      webStream.on("data", chunk => {
        console.log("ondata");
        grpcRequest.write(chunk);
      });
      webStream.on("close", () => {
        console.log("onclose");
        // grpcRequest.end();
      });

      grpcRequest.on("headers", headers => {
          console.log("ongrpcresponseheaders");
      })
      grpcRequest.on("response", (headers, flags) => {
        console.log("ongrpcresponse");
        webStream.respond(cleanResponseHeaders(headers));
        // Copy new headers over.
        // Object.apply(webResponseHeaders, prepareHeaders(headers, webResponseHeaders));
      });
      grpcRequest.on("trailers", (headers, flags) => {
        console.log("ongrpctrailers");
        webStream.write(trailersToPayload(headers));
      });
      grpcRequest.on("data", chunk => {
        console.log("ongrpcdata");
        webStream.write(chunk);
      });
      grpcRequest.on("error", e => {
        console.log("ongrpcerror");
        console.log(e);
      });
      grpcRequest.on("end", () => {
        console.log("ongrpcend");
        // webStream.write(getTrailerPayload(grpcResponseHeaders, webResponseHeaders));
        webStream.end();
        console.log("endedwebstream");
      });
    } catch (e) {
      console.error(e);
    }
  }
}

function cleanResponseHeaders(grpcHeaders: http2.IncomingHttpHeaders): http2.OutgoingHttpHeaders {
  const newHeaders: http2.OutgoingHttpHeaders = { ...grpcHeaders };
  // The original content type was grpc, change to web.
  newHeaders["content-type"] = grpcWebContentType;
  newHeaders["access-control-expose-headers"] = [
    "grpc-status",
    "grpc-message",
    ...Object.keys(newHeaders)
  ].join(", ");
  return newHeaders;
}

function trailersToPayload(trailerHeaders: http2.IncomingHttpHeaders) {
  const headersBuffer = Buffer.from(
    Object.keys(trailerHeaders)
      .map(key => `${key} = ${trailerHeaders[key]}`)
      .join("\r\n")
  );
  const trailerGrpcDataHeader = new Uint8Array([128, 0, 0, 0, 0]); // MSB=1 indicates this is a trailer data frame.
  const trailerGrpcDataHeaderView = new DataView(trailerGrpcDataHeader);
  trailerGrpcDataHeaderView.setUint32(1, headersBuffer.byteLength, false);

  return Buffer.concat([trailerGrpcDataHeader, headersBuffer]);
}

function getTrailerPayload(
  grpcHeaders: http2.IncomingHttpHeaders,
  flushedWebHeaders: http2.OutgoingHttpHeaders
) {
  const trailers = extractTrailingHeaders(grpcHeaders, flushedWebHeaders);
  const headersBuffer = Buffer.from(
    Object.keys(trailers)
      .map(key => `${key} = ${trailers[key]}`)
      .join("\r\n")
  );
  const trailerGrpcDataHeader = new Uint8Array([128, 0, 0, 0, 0]); // MSB=1 indicates this is a trailer data frame.
  const trailerGrpcDataHeaderView = new DataView(trailerGrpcDataHeader);
  trailerGrpcDataHeaderView.setUint32(1, headersBuffer.byteLength, false);

  return Buffer.concat([trailerGrpcDataHeader, headersBuffer]);
}

function extractTrailingHeaders(
  grpcHeaders: http2.IncomingHttpHeaders,
  flushedWebHeaders: http2.OutgoingHttpHeaders
): http2.OutgoingHttpHeaders {
  const newHeaders: http2.OutgoingHttpHeaders = {};
  Object.keys(grpcHeaders)
    // Don't write this header for some reason.
    .filter(key => key === "trailer")
    // Don't write keys we've already flushed.
    .filter(key => !!flushedWebHeaders[key])
    .forEach(key => {
      // Strip trailer prefixes and make everything lowercase as per protocol spec.
      newHeaders[key.replace("Trailer:", "").toLowerCase()] = grpcHeaders[key];
    });
  return newHeaders;
}

new GrpcWebProxy("http://127.0.0.1:8001", { port: 8000 });
