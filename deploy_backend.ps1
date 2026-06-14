Write-Host "Compressing backend..."
Compress-Archive -Path backend -DestinationPath backend.zip -Force

Write-Host "Uploading to S3..."
aws s3 cp backend.zip s3://secondlife-commerce-frontend-331608077815/backend.zip

Write-Host "Deploying to EC2 via SSM..."
$script = @"
sudo apt-get install -y unzip
cd /home/ubuntu
wget -O backend.zip https://secondlife-commerce-frontend-331608077815.s3.amazonaws.com/backend.zip
unzip -o backend.zip
cd backend/ml-service
sudo fallocate -l 4G /swapfile || true
sudo chmod 600 /swapfile || true
sudo mkswap /swapfile || true
sudo swapon /swapfile || true
sudo apt-get install -y python3-venv
python3 -m venv venv
/home/ubuntu/backend/ml-service/venv/bin/pip install --no-cache-dir -r requirements.txt
/home/ubuntu/backend/ml-service/venv/bin/pip install --no-cache-dir fastapi uvicorn
sudo fuser -k 80/tcp
nohup /home/ubuntu/backend/ml-service/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 80 > /home/ubuntu/server.log 2>&1 &
"@

aws ssm send-command `
    --instance-ids "i-01df2a2ba7c830ff7" `
    --document-name "AWS-RunShellScript" `
    --parameters commands="$script"

Write-Host "Deployment initiated! It will take about 2-3 minutes for the server to install dependencies and boot."
