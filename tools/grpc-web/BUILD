package(default_visibility = ["//visibility:public"])

load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "grpc-web",
    srcs = glob(["**/*.ts"]),
    deps = [
        "@npm//@types/node",
    ],
)

load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

nodejs_binary(
    name = "bin",
    bootstrap = ["source-map-support/register"],
    data = [
        ":grpc-web",
        "@npm//source-map-support",
    ],
    entry_point = ":index.ts",
)
