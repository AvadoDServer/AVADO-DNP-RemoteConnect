ARG ALPINE_IMAGE=node
ARG ALPINE_VERSION=19.9.0-alpine3.16
# ARG ZT_COMMIT=a872cc341866f84f07fd58a5d26bcfdad6714174
#ARG ZT_VERSION=1.10.6

# FROM --platform=linux/amd64 ${ALPINE_IMAGE}:${ALPINE_VERSION} as builder

# ARG ZT_COMMIT

# RUN apk add --update alpine-sdk linux-headers iptables\
#   && git clone --quiet https://github.com/zerotier/ZeroTierOne.git /src \
#   && git -C src reset --quiet --hard ${ZT_COMMIT} \
#   && cd /src \
#   && make -f make-linux.mk


# build image for monitor & wizard
FROM --platform=linux/amd64 ${ALPINE_IMAGE}:${ALPINE_VERSION} as builder-nodejs
RUN apk add --no-cache --purge --clean-protected --update nodejs

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


# FROM --platform=linux/amd64 ${ALPINE_IMAGE}:${ALPINE_VERSION}
FROM --platform=linux/amd64 zyclonite/zerotier

# COPY --from=builder /src/zerotier-one /usr/sbin/

RUN apk add --no-cache --purge --clean-protected --update libc6-compat libstdc++ supervisor nodejs nginx bash iptables \
  && mkdir -p /var/lib/zerotier-one \
  # && ln -s /usr/sbin/zerotier-one /usr/sbin/zerotier-idtool \
  # && ln -s /usr/sbin/zerotier-one /usr/sbin/zerotier-cli \
  && rm -rf /var/cache/apk/*

COPY --from=builder-nodejs /usr/src/monitor /usr/monitor
COPY --from=builder-nodejs /usr/src/wizard/build /usr/www/wizard

COPY files/nginx.conf /etc/nginx/nginx.conf
COPY files/supervisord.conf /etc/supervisord.conf
COPY files/start.sh /opt/start.sh
RUN chmod 755 /opt/start.sh
COPY files/route.list /opt/route.list

# commands to run from the host to add members on a headless machine
COPY files/addmember /bin/addmember
RUN chmod 755 /bin/addmember
COPY files/getnetwork /bin/getnetwork
RUN chmod 755 /bin/getnetwork

ENTRYPOINT ["/opt/start.sh"]
