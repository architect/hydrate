import ast
import glob
import json
import os
import pathlib
import sys

try:
    import importlib_metadata
except Exception:
    dir_path = os.path.dirname(os.path.realpath(__file__))
    vendor_path = os.path.join(dir_path, "vendor")
    sys.path.append(vendor_path)
    if not os.path.exists(vendor_path):
        import zipfile

        vendor_zip = os.path.join(dir_path, "vendor.zip")
        with zipfile.ZipFile(vendor_zip, "r") as zipped:
            zipped.extractall(dir_path)
    import importlib_metadata

# This script expects to be run like so: `get_python_deps.py $lambda_runtime $arc_src_dir`
# The Lambda runtime (e.g. `python3.10`) is used to fetch the stdlib json file
src = sys.argv[2]
pattern = f"{src}/**/*.py"
paths = glob.glob(pattern, recursive=True)

deps = []
failures = []
files = list(filter(lambda file: f"{src}/vendor" not in file, paths))


# Load the stdlib list for the Python version in question
filename = f"{sys.argv[1]}.json"
folder = pathlib.Path(__file__).parent.resolve()
stdlib_file = os.path.join(folder, "stdlib", filename)
with open(stdlib_file, encoding="utf-8") as file:
    stdlib = json.loads(file.read())


def clean_deps(deps_list):
    deduped_deps = list(dict.fromkeys(deps_list))
    filtered_deps = list(
        filter(lambda d: d not in stdlib and d != "boto3", deduped_deps)
    )
    return filtered_deps


# Loop over each globbed userland Python file and find its resolvable dependencies
name = importlib_metadata.packages_distributions()
for file in files:
    file_deps = []
    unresolved_deps = []

    with open(file, encoding="utf-8") as raw_file:
        try:
            root = ast.parse(raw_file.read(), file)
        except Exception as error:
            failures.append({"file": file, "error": str(error)})

    # Modified from https://stackoverflow.com/a/9049549 via @GaretJax <3
    for node in ast.walk(root):
        if isinstance(node, ast.Import):
            for n in node.names:
                file_deps.append(n.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            # Ignore relative imports (which are level > 0)
            if node.level == 0:
                file_deps.append(node.module.split(".")[0])

    for dep in clean_deps(file_deps):
        resolved = name.get(dep)
        if resolved:
            deps.append(resolved[0])
        else:
            unresolved_deps.append(dep)

    if len(unresolved_deps):
        failed = ",".join(unresolved_deps)
        failures.append({"file": file, "error": f"Cannot resolve module(s): {failed}"})

print(json.dumps({"deps": clean_deps(deps), "failures": failures, "files": files}))
