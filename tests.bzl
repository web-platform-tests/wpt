# This excludes all folders that start with `.` annotation to remove folders like `.github`
directories = glob(["*"], exclude_directories = 0, exclude = glob(["*", ".*"], exclude_directories = 1))

TEST_GROUPS = {
    name: glob([name + "/**/*"])
    for name in directories
}
