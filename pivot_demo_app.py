#!/usr/bin/env python
"""The pivot demo service""" 

import sys
import os
from optparse import OptionParser
import logging

import time
import json
from functools import wraps
from flask import Flask, request, send_from_directory, jsonify, Response

from elasticsearch import Elasticsearch

# Default paramaters to be used by option parser
DEFAULT_PORT = "8080"

# Set up logging
log = logging.getLogger(__name__)
hdlr = logging.StreamHandler()
log_formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
hdlr.setFormatter(log_formatter)
log.addHandler(hdlr) 


app = Flask(__name__)
es = Elasticsearch()

def check_auth(username, password):
    """This function is called to check if a username /
    password combination is valid.
    """
    
    return username == 'pivot' and password == 'demo'
    
def request_from_localhost():
    """Is the request from localhost?"""
    
    return request.remote_addr == "127.0.0.1"
    
def authenticate():
    """Sends a 401 response that enables basic auth"""
    return Response(
    'Could not verify your access level for that URL.\n'
    'You have to login with proper credentials', 401,
    {'WWW-Authenticate': 'Basic realm="Login Required"'})
    
def deny_access():
    """Sends a 403 response to let user know they are denied access"""
    return Response('Forbidden', 403)

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        
        if (not request_from_localhost()) and (not auth or not check_auth(auth.username, auth.password)):
            return authenticate()
        
        return f(*args, **kwargs)
    return decorated

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
@requires_auth
def index(path):
    if path.startswith('js/') or path.startswith('css/'):
        return send_from_directory('pivot-demo-frontend/', path)
    else:
        return send_from_directory('pivot-demo-frontend/', 'index.html')

@app.route('/results')
@requires_auth
def results():
    query = request.args.get('query')
    
    if query is None:
        return jsonify({'error':'Must provide a query'})
    
    start = time.time()
    
    res = es.search(index="pivot-demo", body=json.loads(query))
    
    stop = time.time()
    total_time = stop - start
    
    return jsonify({'res':res, 'total-time':total_time})

def set_log_level(verbosity):
    """ 
    Set the log level based on an integer between 0 and 2
    """ 

    log_level = logging.WARNING # default
    if verbosity == 1:
        log_level = logging.INFO
    elif verbosity >= 2:
        log_level = logging.DEBUG

    log.setLevel(level=log_level)

def get_options():
    """ 
    Returns the options and arguments passed to this script on the commandline

    @return: (options,args)
    """ 

    usage = "usage: %prog [options] file1 file2 ..." 
    parser = OptionParser(usage)

    parser.add_option("-p", "--port", dest="port", default=DEFAULT_PORT, type=int,
                      help="The port to run the service on Default: [default: %default]")
    parser.add_option('-v', '--verbose', dest='verbose', action='count',
                      help="Increase verbosity (specify multiple times for more)")

    options, args = parser.parse_args()

    return (options, args)

def main(args):
    (options, args) = get_options()
    set_log_level(options.verbose)

    log.debug("Starting with options: %s" % (options))
    
    app.run(host= '0.0.0.0', port=options.port, debug=True)

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
