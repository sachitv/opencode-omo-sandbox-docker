FROM mcp/brave-search:latest

USER root

RUN apk add --no-cache ca-certificates su-exec

COPY entrypoint.sh /usr/local/bin/brave-entrypoint.sh
RUN chmod +x /usr/local/bin/brave-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/brave-entrypoint.sh"]
