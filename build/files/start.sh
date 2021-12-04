#!/bin/bash

echo "Starting supervisord"
supervisord -c /etc/supervisord.conf

FILE=/var/lib/zerotier-one/authtoken.secret
while [ ! -f $FILE ]
do
    echo "waiting for zeroTier to start up ($FILE)"
    sleep 2
done

echo "ZT network keys found!"

sleep 5

cp $FILE /data/authtoken.secret
chmod 644 /data/authtoken.secret

# start the monitoring webservice
echo "Starting monitoring webservice"
node /usr/monitor/index.js /data/authtoken.secret /data &

# waiting for Zerotier IP
# why 2? because you have an ipv6 and an a ipv4 address by default if everything is ok
IP_OK=0
while [ $IP_OK -lt 1 ]
do
  ZTDEV=$( ip addr | grep -i zt | grep -i mtu | awk '{ print $2 }' | cut -f1 -d':' )
  echo "Waiting for a ZeroTier IP on $ZTDEV interface..."
  IP_OK=$( ip addr show dev $ZTDEV | grep -i inet | wc -l )
  sleep 5
done


iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -A FORWARD -i eth0 -o $ZTDEV -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i $ZTDEV -o eth0 -j ACCEPT

echo "sleeping"
while :; do sleep 2073600; done


