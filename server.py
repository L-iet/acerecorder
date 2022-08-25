from flask import request, Flask, make_response, render_template
from flask_cors import CORS
import sys
import json
import os
from gevent.pywsgi import WSGIServer
import googcloud
import multiprocessing
import time
import traceback
import shutil
import pathlib
import zipfile
import tarfile
import re
import subprocess
import requests
import random


test = False
port = 7777 if test else os.environ["PORT"]

_origin_url = "*" if test else "https://l-iet.github.io"

_origins = {"origins":_origin_url}

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
# app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app)

@app.route('/')
def index():
	base_url = "https://storage.googleapis.com/litstorage/"
	# ks = json.loads(requests.get(f'{base_url}1661357713866.tvf').text)['code']
	files = []
	af = googcloud.get_all_files()
	random.shuffle(af)
	for x in af:
		if x.endswith('.tvf'):
			files.append(x)
		if len(files) == 4:
			break
	vids = []
	for filename in files:
		rec_text = json.loads(requests.get(f'{base_url}{filename}').text)
		last_text = {"lastcode":rec_text['code'][-2]['data']['alltext'],"filename":filename}
		vids.append(last_text)

	return render_template('index.html',videos=vids,filename="1661464969745")


@app.route('/environ/<fname>')
def environ(fname):
	if fname == 'new':
		return render_template('environ.html',filename=fname,media_url='', auxmedia='')
	else:
		base_url = "https://storage.googleapis.com/litstorage/"
		text = requests.get(f"{base_url}{fname}.tvf").text
		_dict = json.loads(text)
		auxmedia = _dict['code'][0].get('auxmedia', '')
		media_url = f"{base_url}{fname}.webm" if auxmedia in ['audio','video'] else ''
		return render_template('environ.html',filename=fname, media_url=media_url, auxmedia=auxmedia)

@app.route('/procors/<fname>')
def procors(fname):
	resp = requests.get(f"https://storage.googleapis.com/litstorage/{fname}.tvf").json()
	return make_response(resp, 200)


@app.route('/text', methods=["POST"])
def uploadText():
	text_rec = request.json
	print(text_rec['code'][0])
	
	tvf_url = googcloud.upload(f"{request.json['filename']}.tvf",file_str=json.dumps(request.json))

	resp = make_response({"publicUrl":tvf_url}, 200)
	resp.headers["Content-Type"] = "application/json"
	resp.headers["Access-Control-Allow-Origin"] = _origin_url
	return resp

@app.route('/media/<filename>', methods=["POST"])
def uploadMedia(filename):
	tvm_url = googcloud.upload(f"{filename}.webm", file_str=request.data, content_type="video/webm")
	resp = make_response({"publicUrl":tvm_url}, 200)
	resp.headers["Content-Type"] = "application/json"
	resp.headers["Access-Control-Allow-Origin"] = _origin_url
	return resp

def execute(c,o,e):
	sys.stdout = open(o,'a')
	sys.stderr = open(e,'a')

	def _print(*args, **kwargs):
		print(*args, **kwargs,flush=True)
	globals()['_print'] = _print

	def _f(func):
		def f2(*args, **kwargs):
			print(f"Function {func.__name__}: Permission denied.")
		return f2
	def _g(cls):
		def f2(*args, **kwargs):
			print(f"Class {cls.__name__}: Permission denied.")
		return f2
	os.system = _f(os.system)
	os.path.exists = _f(os.path.exists)
	os.path.isfile = _f(os.path.isfile)
	os.path.isdir = _f(os.path.isdir)
	os.getcwd = _f(os.getcwd)
	os.listdir = _f(os.listdir)
	os.scandir = _f(os.scandir)
	os.walk = _f(os.walk)
	os.chdir = _f(os.chdir)
	os.makedirs = _f(os.makedirs)
	os.mkdir = _f(os.mkdir)
	os.rmdir = _f(os.rmdir)
	os.getenv = _f(os.getenv)
	shutil.copy2 = _f(shutil.copy2)
	shutil.copy = _f(shutil.copy)
	shutil.copytree = _f(shutil.copytree)
	shutil.move = _f(shutil.move)
	shutil.make_archive = _f(shutil.make_archive)
	os.remove = _f(os.remove)
	os.rename = _f(os.rename)
	os.unlink = _f(os.unlink)
	shutil.rmtree = _f(shutil.rmtree)
	pathlib.Path = _g(pathlib.Path)
	zipfile.ZipFile = _g(zipfile.ZipFile)
	tarfile.open = _f(tarfile.open)
	# os.stat = _f(os.stat)
	os.popen = _f(os.popen)
	os.environ = None

	try:
		exec(c)
	except Exception as e:
		l = traceback.format_exception(*sys.exc_info())
		s = ''
		for x in l[::-1]:
			s = x + s
			if '<module>' in x:
				break
		print(e,s,sep='\n',file=sys.stderr)
	
@app.route('/runCode', methods=["POST"])
def run():
	t = str(time.time())
	of = t + '.txt'
	ef = t + '.log'

	with open(of,'w'), open(ef,'w'):
		pass

	wait_time = 10
	_c = request.json['text']
	_c = re.sub(r'\bprint\b','_print',_c)

	ser = re.search(r'\bopen\b|\bsubprocess\b|\bmultiprocessing\b|\bthreading\b',_c)
	if ser:
		resp = make_response({'output':f'Object {ser.group()}: Permission denied.', 'error':''})
	elif re.search(r'\bos\s*.\s*stat\b|\bfrom os import stat',_c):
		resp = make_response({'output':f'Function stat: Permission denied.','error':''})

	else:
		print("running\n", _c)
		p = multiprocessing.Process(target=execute,name="execute_code",args=(_c,of,ef))
		p.start()
		p.join(wait_time)
		if p.is_alive():
			p.terminate()
			print(f"\nProcess terminated after {wait_time} seconds.",file=open(of,'a'))
			p.join()

		with open(of) as o, open(ef) as e:
			out = o.read(); err = e.read()

		resp = make_response({"output":out, "error":err}, 200)
	os.remove(of); os.remove(ef)
	resp.headers["Content-Type"] = "application/json"
	resp.headers["Access-Control-Allow-Origin"] = _origin_url
	return resp

@app.route('/help')
def help():
	return render_template('help.html')


if __name__ == '__main__':
	# app.run(port=port)
	http_server = WSGIServer(('127.0.0.1', port), app)
	http_server.serve_forever()


