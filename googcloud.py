from google.cloud import storage
import os
import json
from google.oauth2 import service_account

test = False
if test:
    with open(os.environ['JSON_FILE']) as f:
        credentials_dict = json.load(f)
else:
    credentials_dict = os.environ

credentials = service_account.Credentials.from_service_account_info(
    credentials_dict)
client = storage.Client(credentials=credentials)
bucket = client.bucket('litstorage')

def upload(filename, file_path=None, file_obj=None, file_str=None):
    assert (file_path or file_obj or file_str), "You need to give one of file_path, file_obj or file_str"
    blob = bucket.blob(filename)

    if file_path:
        blob.upload_from_filename(file_path)
    elif file_obj:
        blob.upload_from_file(file_obj)
    else:
        blob.upload_from_string(file_str)
    blob.make_public()
    return blob.public_url