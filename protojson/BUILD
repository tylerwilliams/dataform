load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

go_library(
    name = "go_default_library",
    srcs = ["protojson.go"],
    importpath = "github.com/dataform-co/dataform/protojson",
    visibility = ["//visibility:public"],
    deps = [
        "@com_github_golang_protobuf//descriptor:go_default_library_gen",
        "@com_github_golang_protobuf//jsonpb:go_default_library_gen",
        "@com_github_golang_protobuf//proto:go_default_library",
        "@io_bazel_rules_go//proto/wkt:descriptor_go_proto",
    ],
)

go_test(
    name = "go_default_test",
    srcs = ["protojson_test.go"],
    embed = [
        ":go_default_library",
    ],
    deps = [
        "//protos:dataform_go_proto",
        "@com_github_golang_protobuf//descriptor:go_default_library_gen",
        "@com_github_golang_protobuf//proto:go_default_library",
    ],
)
