package(default_visibility = ["//visibility:public"])

load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("@df//tools:css_typings.bzl", "css_typings")

filegroup(
    name = "files",
    srcs = glob(["**/*.*"]),
)

load("@io_bazel_rules_sass//:defs.bzl", "multi_sass_binary")

multi_sass_binary(
    name = "sass",
    srcs = glob(["**/*.scss"]),
    output_style = "expanded",
    sourcemap = False,
)

css_typings(
    name = "css_typings",
    srcs = [
        ":sass",
    ],
)

ts_library(
    name = "components",
    srcs = glob([
        "*.tsx",
        "forms/*.ts",
        "forms/*.tsx",
    ]),
    data = [
        ":sass",
    ],
    deps = [
        ":css_typings",
        "@npm//@blueprintjs/core",
        "@npm//@blueprintjs/icons",
        "@npm//@blueprintjs/select",
        "@npm//@types/react",
        "@npm//react",
    ],
)
