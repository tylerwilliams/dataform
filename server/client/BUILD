package(default_visibility = ["//visibility:public"])

load("//tools:css_typings.bzl", "css_typings")

filegroup(
    name = "assets",
    srcs = glob(["**/*.html"])
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
        "@npm//@blueprintjs/core",
        "@npm//@types/node",
        "@npm//@types/react",
        "@npm//@types/react-dom",
        "@npm//@types/react-router",
        "@npm//@types/react-router-dom",
        "@npm//react",
        "@npm//react-dom",
        "@npm//react-router",
        "@npm//react-router-dom",
        "@npm//protobufjs"
    ],
)

ts_library(
    name = "bundler-lib",
    srcs = ["webpack.ts"],
    deps = [
        "//tools/webpack",
        "@npm//@types/node",
        "@npm//@types/webpack",
        "@npm//babel-loader",
        "@npm//babel-plugin-transform-runtime",
        "@npm//babel-preset-env",
        "@npm//css-loader",
        "@npm//style-loader",
        "@npm//umd-compat-loader",
        "@npm//webpack",
    ],
)

load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

nodejs_binary(
    name = "devserver",
    data = [
        ":client",
        ":bundler",
        ":assets",
    ],
    entry_point = ":webpack.ts",
    tags = [
        "ibazel_notify_changes",
    ],
    templated_args = [
        "--output=./app.bundle.js",
        "--entry=df/server/client/index",
        "--mode=development",
        "--devserver",
    ],
)

nodejs_binary(
    name = "bundler",
    data = [
        ":client",
        ":bundler-lib",
        ":css",
    ],
    entry_point = ":webpack.ts",
)

load("//tools/webpack:webpack_bundle.bzl", "webpack_bundle")

webpack_bundle(
    name = "bundle",
    bundler = ":bundler",
    data = ["//:tsconfig.json"],
    entry = "df/server/client/index",
    outputs = [
        "app.bundle.js"
    ],
)
