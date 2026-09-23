FROM python:3.10-slim-bullseye AS builder

ENV PYTHONUNBUFFERED=1

# bullseye moved to the Debian archive. The bullseye-security suite isn't
# published there under its old path, so drop that line and only point the
# main/updates repos at the archive; disable Valid-Until checks since
# archived Release files are frozen.
RUN sed -i \
        -e '\|deb.debian.org/debian-security|d' \
        -e 's|deb.debian.org/debian|archive.debian.org/debian|g' \
        /etc/apt/sources.list \
    && apt-get -o Acquire::Check-Valid-Until=false update \
    && apt-get install -y --no-install-recommends libcairo2-dev gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.10-slim-bullseye AS runtime

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

COPY --from=builder /install /usr/local

COPY . .

RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["sh", "entrypoint.sh"]
