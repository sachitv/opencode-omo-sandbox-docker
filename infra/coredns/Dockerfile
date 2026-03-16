# syntax=docker/dockerfile:1.20.0

FROM python:3.12-alpine AS corefile-generator

WORKDIR /work

COPY infra/mitmproxy/allow-list.yaml /work/allow-list.yaml
COPY infra/coredns/generate-corefile.py /work/generate-corefile.py

RUN python3 -m pip install --no-cache-dir pyyaml

RUN python3 -c "import yaml, pathlib; yaml.safe_load(pathlib.Path('/work/allow-list.yaml').read_text(encoding='utf-8'))"

RUN python3 /work/generate-corefile.py \
  --input /work/allow-list.yaml \
  --output /work/Corefile

FROM coredns/coredns:1.13.1

COPY --from=corefile-generator /work/Corefile /Corefile

ENTRYPOINT ["/coredns"]
CMD ["-conf", "/Corefile"]
