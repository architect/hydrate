# Python stdlib lists by Lambda runtime version

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
