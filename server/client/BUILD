package(default_visibility = ["//visibility:public"])

load("//tools:css_typings.bzl", "css_typings")

filegroup(
    name = "assets",
    srcs = glob([
        "**/*.html",
        "public/**/*.*",
    ]),
)

filegroup(
    name = "css",
    srcs = glob(["**/*.css"]),
)

css_typings(
    name = "css_typings",
    srcs = glob(["**/*.css"]),
)

load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "client",
    srcs = glob(
        [
            "**/*.ts",
            "**/*.tsx",
        ],
        exclude = ["webpack.ts"],
    ),
    data = [":css"],
    deps = [
        ":css_typings",
        "//protos",
        "//tools/protobufjs:grpc_web_rpc_impl",
        "@npm//@blueprintjs/core",
        "@npm//@types/node",
        "@npm//@types/react",
        "@npm//@types/react-dom",
        "@npm//@types/react-router",
        "@npm//@types/react-router-dom",
        "@npm//protobufjs",
        "@npm//react",
        "@npm//react-dom",
        "@npm//react-router",
        "@npm//react-router-dom",
    ],
)

load("@npm//webpack-dev-server:index.bzl", "webpack_dev_server")

webpack_dev_server(
    name = "devserver",
    args = [
        "--config=server/client/webpack.config.js",
        "--output=./app.bundle.js",
    ],
    data = [
        ":assets",
        ":client",
        ":webpack.config.js",
        "@npm//webpack-cli",
    ],
    tags = [
        # "ibazel_notify_changes",
    ],
)

load("@npm//webpack:index.bzl", "webpack")

webpack(
    name = "bundler",
    data = [
        ":assets",
        ":client",
        ":webpack.config.js",
        "@npm//webpack-cli",
    ],
)

load("@build_bazel_rules_nodejs//:index.bzl", "npm_package_bin")

npm_package_bin(
    name = "bundle",
    outs = [
        "app.bundle.js",
    ],
    args = [
        "--config=server/client/webpack.config.js",
        "--output=$(location app.bundle.js)",
    ],
    data = [
        ":webpack.config.js",
        "@npm//umd-compat-loader",
    ],
    tool = ":bundler",
)
