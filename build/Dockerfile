ARG ALPINE_IMAGE=node
ARG ALPINE_VERSION=8.14.0-alpine
ARG ZT_COMMIT=81de6d2dfa53f0fcdc10b6c22869349b89d466d2
ARG ZT_VERSION=1.8.1

FROM ${ALPINE_IMAGE}:${ALPINE_VERSION} as builder

ARG ZT_COMMIT

RUN apk add --update alpine-sdk linux-headers iptables\
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

# build wizard
WORKDIR /usr/src/wizard
COPY wizard .
RUN rm -Rf   node_modules
RUN rm yarn.lock
RUN yarn add react-scripts 
RUN yarn 
RUN yarn build


FROM ${ALPINE_IMAGE}:${ALPINE_VERSION}

COPY --from=builder /src/zerotier-one /usr/sbin/

RUN apk add --no-cache --purge --clean-protected --update libc6-compat libstdc++ supervisor nodejs nginx bash iptables \
  && mkdir -p /var/lib/zerotier-one \
  && ln -s /usr/sbin/zerotier-one /usr/sbin/zerotier-idtool \
  && ln -s /usr/sbin/zerotier-one /usr/sbin/zerotier-cli \
  && rm -rf /var/cache/apk/*

COPY --from=builder-nodejs /usr/src/monitor /usr/monitor
COPY --from=builder-nodejs /usr/src/wizard/build /usr/www/wizard

COPY files/nginx.conf /etc/nginx/nginx.conf
COPY files/supervisord.conf /etc/supervisord.conf
COPY files/start.sh /opt/start.sh
RUN chmod 755 /opt/start.sh
COPY files/route.list /opt/route.list

ENTRYPOINT ["/opt/start.sh"]
