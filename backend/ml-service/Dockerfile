FROM public.ecr.aws/lambda/python:3.10

# Copy requirements file
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . ${LAMBDA_TASK_ROOT}

# Set the CMD to the Mangum handler in main.py
CMD [ "main.handler" ]
