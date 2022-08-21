from flask import request, redirect, jsonify, Flask
import requests
import json
import os

port = 7777

app = Flask(__name__)

@app.route('/')
def upload():
	text_rec_s = request.json['textRec']
	text_rec = json.loads(text_rec_s)
	if 'auxmedia' in text_rec[0]:
		# do stuff to get the media
		link = request.json['link']
		pass
	with open('textfiles/' + request.json['filename'] + '.trf', 'w') as f:
		f.write(text_rec_s)
	print(os.listdir('textfiles'))




if __name__ == '__main__':
	app.run(port=port)



