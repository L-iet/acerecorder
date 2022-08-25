from google.cloud import storage
import os
import json
from google.oauth2 import service_account

test = True
if test:
	with open(os.environ['JSON_FILE']) as f:
		credentials_dict = json.load(f)
else:
	credentials_dict = os.environ

credentials = service_account.Credentials.from_service_account_info(
	credentials_dict)
client = storage.Client(credentials=credentials)
bucket = client.bucket('litstorage')

def upload(filename, file_path=None, file_obj=None, file_str=None, **kwargs):
	assert (file_path or file_obj or file_str), "You need to give one of file_path, file_obj or file_str"
	blob = bucket.blob(filename)

	if file_path:
		blob.upload_from_filename(file_path)
	elif file_obj:
		blob.upload_from_file(file_obj, **kwargs)
		print("here")
	else:
		blob.upload_from_string(file_str, **kwargs)
	blob.make_public()
	return blob.public_url

def get_all_files():
	return [b.name for b in client.list_blobs('litstorage')]


if __name__ == '__main__':
	pass


