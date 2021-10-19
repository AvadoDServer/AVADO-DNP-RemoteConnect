#!/bin/sh

export PATH=/bin:/usr/bin:/usr/local/bin:/sbin:/usr/sbin

echo "NET/TUN device"
echo "-----"
ls -lR /dev/
echo "-----"

curl https://install.zerotier.com/ | bash

echo "------------------------------------------------------------"
echo "Starting ZeroTier client"
zerotier-one -d

echo "------------------------------------------------------------"
echo "Join a network"
sleep 3
zerotier-cli join 1d7193940437440b

echo "------------------------------------------------------------"
echo "Listing networks"
/usr/sbin/zerotier-cli listnetworks       

echo "IP addresses:"

while true;
do
ps ax
ip address
sleep 60
done

