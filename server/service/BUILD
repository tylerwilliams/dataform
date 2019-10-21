package(default_visibility = ["//visibility:public"])

load("//tools/protobufjs:ts_grpc_service.bzl", "ts_grpc_service")

# This spits out TS files that we can use as srcs.
ts_grpc_service(
    name = "grpc_service",
    root = "protos",
    srcs = ["//protos:files"],
    protos_import = "@dataform/protos",
    service = "Service"
)

load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "service",
    module_name = "@dataform/server/service",
    srcs = glob(["**/*.ts"]) + [":grpc_service"],
    deps = [
        "//protos",
        "//api",
        "//core",
        "@npm//grpc",
        "@npm//@types/node",
        "@npm//yargs",
        "@npm//protobufjs",
        "@npm//@types/yargs",
    ],
)

load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

nodejs_binary(
    name = "bin",
    bootstrap = ["source-map-support/register"],
    data = [
        ":service",
        "@npm//source-map-support",
    ],
    entry_point = ":index.ts",
)
