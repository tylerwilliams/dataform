package(default_visibility = ["//visibility:public"])

load("@npm//@storybook/react:index.bzl", "start_storybook")

filegroup(
    name = "stories",
    srcs = glob(["stories/*.jsx"]),
)

start_storybook(
    name = "storybook",
    args = [
        "--config-dir",
        "components/storybook",
        "--port",
        "8081",
        "--ci",
    ],
    data = [
        ":addons.js",
        ":config.jsx",
        ":preview-head.html",
        ":stories",
        ":webpack.config.js",
        "//components",
        "//components:sass",
        "@npm//@storybook/source-loader",
        "@npm//css-loader",
        "@npm//style-loader",
        "@npm//umd-compat-loader",
    ],
)
