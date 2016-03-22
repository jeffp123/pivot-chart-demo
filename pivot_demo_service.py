#!/usr/bin/env python
"""The pivot demo service""" 

import sys
from optparse import OptionParser
import fileinput
import logging

from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from pivot_demo_app import app

# Defaults
DEFAULT_PORT = 8080


# Set up logging
log = logging.getLogger(__name__)
hdlr = logging.StreamHandler()
log_formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
hdlr.setFormatter(log_formatter)
log.addHandler(hdlr)



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
    
    parser.add_option('-p', '--port', dest='port', default=DEFAULT_PORT,
                      help="The port number [default: %default]")
    parser.add_option('-v', '--verbose', dest='verbose', action='count',
                      help="Increase verbosity (specify multiple times for more)")

    options, args = parser.parse_args()

    return (options, args)
    
def main(args):
    (options, args) = get_options()
    set_log_level(options.verbose)

    log.debug("Starting with options: %s" % (options))
    
    # TODO: This will log everything to stderr, but we might want to look into
    # a more robust logging solution
    # Check here: http://www.tornadoweb.org/en/stable/log.html
    from tornado.log import enable_pretty_logging
    enable_pretty_logging() 
    
    # Start server
    http_server = HTTPServer(WSGIContainer(app))
    http_server.listen(options.port)
    IOLoop.instance().start()

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
