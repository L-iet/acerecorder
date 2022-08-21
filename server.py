from flask import request, redirect, jsonify, Flask
from flask_cors import CORS
import requests
import json
import os

port = 7777

app = Flask(__name__)
CORS(app)

@app.route('/', methods=["POST"])
def upload():
	text_rec = request.json['textRec']
	# text_rec = json.loads(text_rec_s)
	if 'auxmedia' in text_rec[0]:
		# do stuff to get the media
		link = request.json['link']
		pass
	with open(f'textfiles/{ request.json["filename"] }.trf', 'w') as f:
		json.dump(text_rec, f)
	print(os.listdir('textfiles'))
	return "Done."




if __name__ == '__main__':
	app.run(port=port,debug=True)



