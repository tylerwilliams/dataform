load("@io_bazel_rules_go//go:def.bzl", "go_binary", "go_library")

go_library(
    name = "go_default_library",
    srcs = ["main.go"],
    importpath = "github.com/dataform-co/dataform/protomongo/test",
    visibility = ["//visibility:private"],
    deps = [
        "//protomongo:go_default_library",
        "//protos:dataform_go_proto",
        "@com_github_golang_protobuf//proto:go_default_library",
        "@org_mongodb_go_mongo_driver//bson:go_default_library",
        "@org_mongodb_go_mongo_driver//mongo:go_default_library",
        "@org_mongodb_go_mongo_driver//mongo/options:go_default_library",
    ],
)

go_binary(
    name = "test",
    embed = [":go_default_library"],
    visibility = ["//visibility:public"],
)
