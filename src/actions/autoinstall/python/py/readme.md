# Why we did stuff this way

## Getting package subdependencies

Later versions of Python have some (seemingly complex) affordances for getting package metadata, but our approach is to support earlier versions where possible.

So, on that note, we tried the popular `pipreqs` tool and found it to be unreliable in determining package names. Aditionally we also tried `pipgrip`, `freeze`-ing reqs, `pip show` (which does not print the subdependency tree), `johnnydep`, and some other techniques.

None worked as well, or reliably, as `pipdeptree`, so for now that is now a pre-installed requirement for Python Lambda treeshaking.

Aside: I would have vendored `pipdeptree` alongside `importlib_metadata`, but it really does not want to be called that way, so we'll just have to continue using it as a CLI util for now.


## Python stdlib lists (by Lambda runtime version)

Unfortunately, Python did not add `sys.stdlib_module_names` until Python v3.10, which means folks on earlier versions cannot reliably pull a current list of stdlib modules.

Moreover, without a static list, we may get false errors on machines with versions of Python that do not match what's in Lambda.

So we went ahead and just scraped the official stdlib module lists from:

- https://docs.python.org/3.7/py-modindex.html
- https://docs.python.org/3.8/py-modindex.html
- https://docs.python.org/3.9/py-modindex.html
- https://docs.python.org/3.10/py-modindex.html
- https://docs.python.org/3.11/py-modindex.html


Here's the script, for reference:

```py
import json
import requests
from bs4 import BeautifulSoup

url = "https://docs.python.org/3.11/py-modindex.html"
print(url)

response = requests.get(url)
soup = BeautifulSoup(response.content, "html.parser")

modules = []
for row in soup.find_all("tr")[1:]:  # Skip the header row
    if row.find("code", class_="xref"):
        module = row.find("code", class_="xref").text.strip().split(".")[0]
        modules.append(module)

modules = list(dict.fromkeys(modules))
print(json.dumps(modules))
```


## `importlib_metadata`

`importlib_metadata` vendored with gratitude from https://github.com/python/importlib_metadata and used under the Apache license
