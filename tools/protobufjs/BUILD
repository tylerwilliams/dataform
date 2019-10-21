package(default_visibility = ["//visibility:public"])

load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

exports_files([
    "ts_grpc_service.bzl"
])

ts_library(
    name = "grpc_web_rpc_impl",
    srcs = glob([
        "grpc_web_rpc_impl.ts"
    ]),
    deps = [
        "//protos",
        "@npm//grpc-web-client",
        "@npm//protobufjs",
    ],
)

ts_library(
    name = "generate_service_defs_lib",
    srcs = ["generate_service_defs.ts"],
    deps = [
        "@npm//@types/node",
        "@npm//@types/yargs",
        "@npm//path-exists",
        "@npm//protobufjs",
        "@npm//yargs",
    ],
)

nodejs_binary(
    name = "generate_service_defs",
    bootstrap = ["source-map-support/register"],
    data = [
        ":generate_service_defs_lib",
        "@npm//source-map-support",
    ],
    entry_point = ":generate_service_defs.ts",
)
