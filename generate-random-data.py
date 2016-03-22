#!/usr/bin/env python
"""Generate random data with gender, age, and answer to a multiple-choice question. 
Output as json""" 

import sys
from optparse import OptionParser
import fileinput
import logging

from random import randint, choice
import json


# Default paramaters to be used by option parser
DEFAULT_NUM_ENTRIES = 100000

# Set up logging
log = logging.getLogger(__name__)
hdlr = logging.StreamHandler()
log_formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
hdlr.setFormatter(log_formatter)
log.addHandler(hdlr) 

def get_random_entry():
    entry = {}
    
    entry['gender'] = choice(['M','F'])
    entry['age'] = randint(18,75)
    entry['household_income'] = randint(10,200)
    entry['favorite_color'] = choice(['Red', 'Orange', 'Yellow',
                                      'Green', 'Blue', 'Indigo',
                                      'Violet'])
    entry['QS6_6'] = choice(['A bank',
                             'Discount store like Walmart',
                             'A credit union',
                             'supermarket',
                             'convenience store'])
    
    entry['Q30b'] = choice(['Yes, a contactless debit card',
                            'Yes, a contactless general purpose credit or charge card',
                            'No',
                            'Not sure',
                            'Sigma'])
                            
    entry['Q31_1'] = choice(['A general purpose credit card',
                             'A debit card that pays for purchases immediately from funds in my checking account',
                             'Paypal or other online payment service',
                             'A store credit card for charging purchases at just one store or store chain that lets me pay a minimum amount or more on the balances each month or pay it off as I choose',
                             'A general purpose charge card that requires me to pay the whole bill each month'])
                             
    return entry

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

    parser.add_option("-n", "--num-entries", dest="num_entries", default=DEFAULT_NUM_ENTRIES,
                      type="int", help="Number of entries Default: [default: %default]")
    parser.add_option('-v', '--verbose', dest='verbose', action='count',
                      help="Increase verbosity (specify multiple times for more)")

    options, args = parser.parse_args()

    return (options, args)

def main(args):
    (options, args) = get_options()
    set_log_level(options.verbose)

    log.debug("Starting with options: %s" % (options))
    
    for i in range(options.num_entries):
        entry = get_random_entry()
        entry['id'] = i + 1
        
        print json.dumps(entry)

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
