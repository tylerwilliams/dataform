package(default_visibility = ["//visibility:public"])

load("//tools/protobufjs:ts_grpc_service.bzl", "ts_grpc_service")

# This spits out TS files that we can use as srcs.
ts_grpc_service(
    name = "grpc_service",
    srcs = ["//protos:files"],
    protos_import = "@dataform/protos",
    root = "protos",
    service = "Service",
)

load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "service",
    srcs = glob(["**/*.ts"]) + [":grpc_service"],
    module_name = "@dataform/server/service",
    deps = [
        "//api",
        "//core",
        "//protos",
        "//tools/grpc-web-proxy",
        "@npm//@types/node",
        "@npm//@types/yargs",
        "@npm//grpc",
        "@npm//protobufjs",
        "@npm//yargs",
    ],
)

load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

nodejs_binary(
    name = "bin",
    data = [
        ":service",
        "@npm//source-map-support",
    ],
    entry_point = ":index.ts",
    templated_args = ["--node_options=--require=source-map-support/register"],
)
