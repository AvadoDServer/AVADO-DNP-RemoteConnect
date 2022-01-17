#!/bin/sh
echo "Setting up SSH tunnel to host"
mkfifo /tmp/fifo
nc -l -l 22 </tmp/fifo | nc 172.33.0.1 >fifo

echo "tunnel exited!"
