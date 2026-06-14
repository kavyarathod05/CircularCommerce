#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting Ubuntu UserData script..."

apt-get update -y
apt-get install -y git python3-pip python3-venv

cd /home/ubuntu
git clone https://github.com/kavyarathod05/hackon_amazon.git
chown -R ubuntu:ubuntu hackon_amazon

cd hackon_amazon/backend/ml-service

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
pip install uvicorn

echo "Starting Uvicorn..."
nohup /home/ubuntu/hackon_amazon/backend/ml-service/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 80 > /home/ubuntu/server.log 2>&1 &

echo "UserData script completed."
