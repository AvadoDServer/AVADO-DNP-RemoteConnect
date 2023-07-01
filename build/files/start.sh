#!/bin/bash

# if [ ! -f /var/lib/zerotier-one/local.conf_ ]; then
#   echo "creating local.conf"
#   mkdir -p  /var/lib/zerotier-one
#   cat << EOF > /var/lib/zerotier-one/local.conf
# {
#   "settings": {
#     "secondaryPort": 41235,
#     "tertiaryPort": 56835
#   }
# }
# EOF
# fi

rm -f /var/lib/zerotier-one/local.conf

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
ZTDEV=""
while [ $IP_OK -lt 1 ]
do
  ZTDEV=$( ip addr | grep -i zt | grep -i mtu | awk '{ print $2 }' | cut -f1 -d':' )
  if [ -z "$ZTDEV" ]; then
    echo "Waiting for ZT device to appear..."
  else
    echo "Waiting for a ZeroTier IP on $ZTDEV interface..."
    IP_OK=$( ip addr show dev $ZTDEV | grep -i inet | wc -l )
  fi
  sleep 10
done
echo "ZeroTier device found!"
ip addr show dev $ZTDEV

echo "ZT config info"
zerotier-cli info -j
echo " ---- "

iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -A FORWARD -i eth0 -o $ZTDEV -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i $ZTDEV -o eth0 -j ACCEPT

# Allow SSH access through container
iptables -t nat -A PREROUTING -p tcp --dport 22 -j DNAT --to-destination `/sbin/ip route|awk '/default/ { print $3 }'`:22

echo "sleeping"

while :; do
if [ -z `zerotier-cli info | grep ONLINE` ]; then
  echo "Zerotier disconnected - restarting"
  supervisorctl restart zerotier
  echo "restarted zerotier"
  sleep 10
else
  echo "Zerotier connected"
fi
sleep 300; 
done


