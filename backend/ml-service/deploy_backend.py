import boto3
import time
import json
import os

iam = boto3.client('iam', region_name='us-east-1')
ec2 = boto3.client('ec2', region_name='us-east-1')

role_name = 'HackathonMLRole'
profile_name = 'HackathonMLProfile'
sg_name = 'HackathonML-SG'

def setup_iam():
    try:
        # Create Role
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        try:
            iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy)
            )
            print(f"Created role {role_name}")
        except iam.exceptions.EntityAlreadyExistsException:
            print(f"Role {role_name} already exists.")
            
        iam.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/AmazonRekognitionFullAccess'
        )
        iam.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
        )
        
        # Create Instance Profile
        try:
            iam.create_instance_profile(InstanceProfileName=profile_name)
            print(f"Created instance profile {profile_name}")
        except iam.exceptions.EntityAlreadyExistsException:
            print(f"Instance profile {profile_name} already exists.")
            
        try:
            iam.add_role_to_instance_profile(
                InstanceProfileName=profile_name,
                RoleName=role_name
            )
            print("Added role to instance profile.")
        except iam.exceptions.LimitExceededException:
            pass
        except Exception as e:
            if 'already contains' not in str(e):
                print(f"Warning adding role to profile: {e}")
                
        print("Waiting 10 seconds for IAM propagation...")
        time.sleep(10)
        return True
    except Exception as e:
        print(f"Warning: IAM Setup failed ({e}). Proceeding without Instance Profile.")
        return False

def setup_sg():
    try:
        # Get default VPC
        vpcs = ec2.describe_vpcs(Filters=[{'Name': 'isDefault', 'Values': ['true']}])
        vpc_id = vpcs['Vpcs'][0]['VpcId']
        
        try:
            sg = ec2.create_security_group(
                GroupName=sg_name,
                Description='Hackathon ML Service SG',
                VpcId=vpc_id
            )
            sg_id = sg['GroupId']
            print(f"Created Security Group {sg_id}")
            
            # Authorize inbound
            ec2.authorize_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 80,
                        'ToPort': 80,
                        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                    },
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 22,
                        'ToPort': 22,
                        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                    }
                ]
            )
        except Exception as e:
            if 'InvalidGroup.Duplicate' in str(e):
                print(f"Security Group {sg_name} already exists.")
                sgs = ec2.describe_security_groups(GroupNames=[sg_name])
                sg_id = sgs['SecurityGroups'][0]['GroupId']
            else:
                raise e
                
        return sg_id
    except Exception as e:
        print(f"Failed to setup SG: {e}")
        return None

def launch_instance(sg_id, use_profile):
    print("Finding the latest Amazon Linux 2023 AMI...")
    ami_response = ec2.describe_images(
        Filters=[
            {'Name': 'name', 'Values': ['al2023-ami-2023.*-x86_64']},
            {'Name': 'state', 'Values': ['available']}
        ],
        Owners=['amazon']
    )
    images = sorted(ami_response['Images'], key=lambda x: x['CreationDate'], reverse=True)
    image_id = images[0]['ImageId']

    user_data = """#!/bin/bash
sudo dnf update -y
sudo dnf install git python3 python3-pip -y

cd /home/ec2-user
git clone https://github.com/kavyarathod05/hackon_amazon.git
cd hackon_amazon/backend/ml-service

# Create virtual environment to bypass PEP 668
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip3 install -r requirements.txt
pip3 install uvicorn fastapi pydantic scikit-learn python-multipart

# Run uvicorn on port 80 using sudo with the venv path
sudo /home/ec2-user/hackon_amazon/backend/ml-service/venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 80 > /home/ec2-user/uvicorn.log 2>&1 &
"""

    run_kwargs = {
        'ImageId': image_id,
        'InstanceType': 't3.micro',
        'MinCount': 1,
        'MaxCount': 1,
        'SecurityGroupIds': [sg_id],
        'UserData': user_data,
        'TagSpecifications': [{
            'ResourceType': 'instance',
            'Tags': [{'Key': 'Name', 'Value': 'Hackathon-ML-Backend'}]
        }]
    }
    
    if use_profile:
        run_kwargs['IamInstanceProfile'] = {'Name': profile_name}
        
    try:
        run_response = ec2.run_instances(**run_kwargs)
        instance_id = run_response['Instances'][0]['InstanceId']
        print(f"SUCCESS! Launched EC2 Instance: {instance_id}")
        
        print("Waiting for Public IP...")
        while True:
            insts = ec2.describe_instances(InstanceIds=[instance_id])
            state = insts['Reservations'][0]['Instances'][0]['State']['Name']
            if state == 'running':
                public_ip = insts['Reservations'][0]['Instances'][0].get('PublicIpAddress')
                if public_ip:
                    print(f"Backend will be available at: http://{public_ip}/api/v1/ml/aws/inspect-condition")
                    print(f"API Documentation: http://{public_ip}/docs")
                    with open('ec2_info.txt', 'w') as f:
                        f.write(public_ip)
                    break
            time.sleep(5)
            
    except Exception as e:
        print(f"FAILED to launch EC2 instance: {e}")

if __name__ == "__main__":
    use_profile = setup_iam()
    sg_id = setup_sg()
    if sg_id:
        launch_instance(sg_id, use_profile)
