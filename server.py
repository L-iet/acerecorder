from flask import request, jsonify, Flask, make_response
from flask_cors import CORS, cross_origin
import sys
import requests
import json
import os
from gevent.pywsgi import WSGIServer
import googcloud
from io import FileIO

test = False
port = 7777 if test else os.environ["PORT"]

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app, resources={r"/": {"origins": "https://l-iet.github.io"}})

@app.route('/', methods=["POST"])
@cross_origin(origin="https://l-iet.github.io",headers=['Content-Type'])
def upload():
	print('received post')
	text_rec = request.json['textRec']
	print(text_rec[0])
	if 'auxmedia' in text_rec[0]:
		# do stuff to get the media
		print(request.json['media'])
		with open('media.webm', 'wb+') as media:
			media.write(request.json['media'])
			media.seek(0)
			tvm_url = googcloud.upload(f"{request.json['filename']}.webm",file_obj=media)
	else:
		tvm_url = None
	tvf_url = googcloud.upload(f"{request.json['filename']}.tvf",file_str=json.dumps(text_rec))

	resp = make_response(jsonify([tvf_url, tvm_url]), 200)
	resp.headers["Content-Type"] = "application/json"
	resp.headers["Access-Control-Allow-Origin"] = "https://l-iet.github.io"
	return resp




if __name__ == '__main__':
	# app.run(port=port)
	http_server = WSGIServer(('0.0.0.0', port), app)
	http_server.serve_forever()


