package(default_visibility = ["//visibility:public"])

load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "server",
    srcs = glob(["*.ts"]),
    data = [
        "//server/client:app.bundle.js",
        "//server/client:assets",
    ],
    module_name = "@dataform/server",
    deps = [
        "//server/service",
        "@npm//@types/express",
        "@npm//@types/node",
        "@npm//@types/yargs",
        "@npm//express",
        "@npm//yargs",
    ],
)

load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

nodejs_binary(
    name = "bin",
    data = [
        ":server",
        "@npm//source-map-support",
    ],
    entry_point = ":index.ts",
    templated_args = ["--node_options=--require=source-map-support/register"],
)
