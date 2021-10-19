# # FROM debian:stretch as builder

# # ## Supports x86_64, x86, arm, and arm64

# # RUN apt-get update && apt-get install -y curl gnupg
# # RUN apt-key adv --no-tty --keyserver ha.pool.sks-keyservers.net --recv-keys 0x1657198823e52a61 
# # RUN echo "deb http://download.zerotier.com/debian/stretch stretch main" > /etc/apt/sources.list.d/zerotier.list
# # RUN apt-get update && apt-get install -y zerotier-one=1.2.12

# FROM centos:7
# #FROM alpine:latest
# #MAINTAINER Adam Ierymenko <adam.ierymenko@zerotier.com>

# LABEL version="1.2.12"
# LABEL description="Containerized ZeroTier One for use on CoreOS or other Docker-only Linux hosts."

# # Uncomment to build in container
# #RUN apk add --update alpine-sdk linux-headers

# RUN yum install -y curl

# #RUN apt-get install curl

# # RUN mkdir -p /var/lib/zerotier-one

# # COPY --from=builder /var/lib/zerotier-one/zerotier-cli /usr/sbin/zerotier-cli
# # COPY --from=builder /var/lib/zerotier-one/zerotier-idtool /usr/sbin/zerotier-idtool
# # COPY --from=builder /usr/sbin/zerotier-one /usr/sbin/zerotier-one

# ADD main.sh /
# RUN chmod 0755 /main.sh
# ENTRYPOINT ["/main.sh"]
# # CMD ["zerotier-one"]

ARG ALPINE_IMAGE=node
ARG ALPINE_VERSION=8.14.0-alpine
ARG ZT_COMMIT=81de6d2dfa53f0fcdc10b6c22869349b89d466d2
ARG ZT_VERSION=1.8.1

FROM ${ALPINE_IMAGE}:${ALPINE_VERSION} as builder

ARG ZT_COMMIT

RUN apk add --update alpine-sdk linux-headers \
  && git clone --quiet https://github.com/zerotier/ZeroTierOne.git /src \
  && git -C src reset --quiet --hard ${ZT_COMMIT} \
  && cd /src \
  && make -f make-linux.mk


# build image for monitor & wizard
FROM node:12-alpine as builder-nodejs

# build monitor
WORKDIR /usr/src/monitor
COPY monitor .
RUN npm i


FROM ${ALPINE_IMAGE}:${ALPINE_VERSION}

# ARG ZT_VERSION

# LABEL org.opencontainers.image.title="zerotier" \
#       org.opencontainers.image.version="${ZT_VERSION}" \
#       org.opencontainers.image.description="ZeroTier One as Docker Image" \
#       org.opencontainers.image.licenses="MIT" \
#       org.opencontainers.image.source="https://github.com/zyclonite/zerotier-docker"

COPY --from=builder /src/zerotier-one /usr/sbin/

RUN apk add --no-cache --purge --clean-protected --update libc6-compat libstdc++ supervisor nodejs bash \
  && mkdir -p /var/lib/zerotier-one \
  && ln -s /usr/sbin/zerotier-one /usr/sbin/zerotier-idtool \
  && ln -s /usr/sbin/zerotier-one /usr/sbin/zerotier-cli \
  && rm -rf /var/cache/apk/*

COPY --from=builder-nodejs /usr/src/monitor /usr/monitor

COPY files/supervisord.conf /etc/supervisord.conf
COPY files/start.sh /opt/start.sh
RUN chmod 755 /opt/start.sh
COPY files/route.list /opt/route.list

# EXPOSE 9993/udp

ENTRYPOINT ["/opt/start.sh"]
