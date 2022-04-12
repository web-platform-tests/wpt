from gentestutils import genTestUtils

genTestUtils(
    "yaml/element",
    "templates-new.yaml",
    "name2dir-canvas.yaml",
    canvas_output_dir="../element",
    include_done=False,
)

genTestUtils(
    "yaml/offscreen",
    "templates-new.yaml",
    "name2dir-offscreen.yaml",
    offscreen_output_dir="../offscreen",
    include_done=False,
)

genTestUtils(
    "yaml-new",
    "templates-new.yaml",
    "name2dir.yaml",
    canvas_output_dir="../element",
    offscreen_output_dir="../offscreen",
    include_done=True,
)
