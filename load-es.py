#!/usr/bin/env python
"""Load json data into elasticsearch

Should run this first:

curl -XDELETE 'http://localhost:9200/pivot-demo/'

curl -XPUT "http://localhost:9200/pivot-demo/" -d'
{
   "mappings": {
      "entry": {
         "properties": {
            "gender": {
               "type": "string"
            },
            "age": {
               "type": "integer"
            },
            "household_income": {
                "type": "integer"
            },
            "favorite_color": {
                "type": "string",
                "index": "not_analyzed"
            },
            "QS6_6": {
                "type": "string",
                "index": "not_analyzed"
            },
            "Q30b": {
                "type": "string",
                "index": "not_analyzed"
            },
            "Q31_1": {
                "type": "string",
                "index": "not_analyzed"
            }
         }
      }
   }
}'


After loading data, a sample query:

curl -XPOST "http://localhost:9200/pivot-demo/entry/_search" -d'{
    "query": {
        "filtered" : {
            "filter" : {
                "and" : [
                    {
                        "range" : {"age" : {"from" : "18", "to" : "20"} }
                    },
                    {
                        "match" : { "gender" : "F" }
                    }
                ]
            }
        }
    },
    "aggregations": {
      "favorite_colors": {
         "terms": {
            "field": "favorite_color"
         }
      }
   }
}' | jq .

"""




import sys
from optparse import OptionParser
import fileinput
import logging

from elasticsearch import Elasticsearch, helpers
import json

# Default paramaters to be used by option parser
DEFAULT_INDEX = "pivot-demo" 

# Set up logging
log = logging.getLogger(__name__)
hdlr = logging.StreamHandler()
log_formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
hdlr.setFormatter(log_formatter)
log.addHandler(hdlr) 

# Function and Classes go here

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

    parser.add_option("-i", "--index-a", dest="index", default=DEFAULT_INDEX,
                      help="The name of the index Default: [default: %default]")
    parser.add_option('-v', '--verbose', dest='verbose', action='count',
                      help="Increase verbosity (specify multiple times for more)")

    options, args = parser.parse_args()

    return (options, args)

def main(args):
    (options, args) = get_options()
    set_log_level(options.verbose)

    log.debug("Starting with options: %s" % (options))
    
    entries = []

    # Accept lines of input from a file specified in the args, or stdin
    for line in (l.strip() for l in fileinput.input(args)):
        
        entry = json.loads(line)
        
        # Modify the entry for elasticsearch
        entry['_type'] = "entry"
        entry['_index'] = options.index
        entry['_id'] = entry['id']
        del entry['id']
        
        entries.append(entry)
    
    es = Elasticsearch()
    helpers.bulk(es, entries)

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
