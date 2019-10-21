def _impl(ctx):
    out = ctx.actions.declare_file(ctx.attr.name + ".ts")
    args = ctx.actions.args()
    args.add("--protos")
    for src in ctx.files.srcs:
        args.add(src.path)
    args.add("--root")
    args.add(ctx.attr.root)
    args.add("--protos-import")
    args.add(ctx.attr.protos_import)
    args.add("--output-path")
    args.add(out.path)
    args.add("--service")
    args.add(ctx.attr.service)
    ctx.actions.run(
        inputs = ctx.files.srcs,
        outputs = [out],
        executable = ctx.executable._tool,
        arguments = [args],
        progress_message = "Generating protobuf service interfaces",
    )

    # Return a structure that is compatible with the deps[] of a ts_library.
    return struct(
        files = depset([out]),
        # typescript = struct(
        #     declarations = depset([out]),
        #     transitive_declarations = depset([out]),
        #     type_blacklisted_declarations = depset(),
        #     es5_sources = depset(),
        #     es6_sources = depset(),
        #     transitive_es5_sources = depset(),
        #     transitive_es6_sources = depset(),
        # ),
    )

ts_grpc_service = rule(
    implementation = _impl,
    attrs = {
        "srcs": attr.label_list(doc = "proto files", allow_files = [".proto"]),
        "protos_import" : attr.string(),
        "root": attr.string(),
        "service" : attr.string(),
        "_tool": attr.label(
            executable = True,
            cfg = "host",
            allow_files = True,
            default = Label("@df//tools/protobufjs:generate_service_defs"),
        ),
    },
)
