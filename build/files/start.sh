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

# Create bridge between ZT and local network
# ip link add name zt_bridge type bridge
# ip link set zt_bridge up
# ip link set eth0 up
# ip link set $ZTDEV up

# #
# # add route rules
# #  from file
# #
# if [ -e /opt/route.list ]
# then
#   echo "Route file found: /opt/route.list"
#   cat /opt/route.list | while read line
#   do  
#     for routeline in "$( echo $line | grep -iv '^#' )"
#     do
#       # if empty line found - skip this loop
#       [ -z "$routeline" ] && { continue; }

#       ADDR="$( echo $routeline | cut -f1 -d',' | cut -f1 -d' ' )"
#       GW="$( echo $routeline | cut -f2 -d',' | cut -f2 -d' '  )"
#       if [ ! -z $ADDR ] && [ ! -z $GW ]
#       then
#         echo "adding route ... $ADDR via $GW"
#         ip route add "$ADDR" via "$GW"
#       fi
#     done
#   done
#   ip route
# fi

echo "sleeping"
sleep 9999


