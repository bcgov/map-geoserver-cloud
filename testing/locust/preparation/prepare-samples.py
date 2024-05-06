import re, operator
from datetime import datetime
from urllib.parse import urlparse, parse_qs, urlencode
from optparse import OptionParser
from operator import itemgetter
import json

def restrict(lst, cutoff, count):
    'Restrict the list by minimum value or count.'
    if cutoff:
        lst = (x for x in lst if x[1] > cutoff)
    if count:
        lst = lst[:count]
    return lst

log_re = '(?P<ip>[.:0-9a-fA-F]+) - - \[(?P<time>.*?)\] "(?P<method>.*?) (?P<uri>.*?) HTTP/1.\d" (?P<status_code>\d+) (?P<size>\d+)'
search = re.compile(log_re).search

def do_work(i, line):
    if i%10000 == 0:
        print(i)
    if i < 200000000000:
        return search(line)
    else:
        return None

def parse(filename):
    'Return tuple of dictionaries containing file data.'
    def make_entry(x):
        url = urlparse("https://apache%s" % x.group('uri'))
        
        query = parse_qs(url.query)

        time_str = x.group('time')
        time = datetime.strptime(time_str, '%d/%b/%Y:%H:%M:%S %z')

        request = "MISSING"
        if "request" in query:
            request = query["request"][0]
        if "REQUEST" in query:
            request = query["REQUEST"][0]

        request = request.upper()

        dim = "MISSING"
        if "width" in query:
            dim = "%sx%s" % (query["width"], query["height"])
        if "WIDTH" in query and "HEIGHT" in query:
            dim = "%sx%s" % (query["WIDTH"], query["HEIGHT"])

        # if "width" in query:
        #     query.pop("width")
        #     query.pop("height")
        bbox = ""
        if "bbox" in query:
            bbox = query.pop("bbox")

        if "BBOX" in query:
            bbox = query.pop("BBOX")

        layers = "MISSING"
        if "layers" in query:
            layers = query["layers"]
        if "LAYERS" in query:
            layers = query["LAYERS"]

        return { 
            'server_ip':x.group('ip'),
            'path':url.path,
            'uri': x.group('uri'),
            'method': x.group('method'),
            'query': str(query),
            'layers': layers,
            'request': request,
            'pathrequest': "%s.%s" % (url.path, request),
            'dim': dim,
            'bbox': bbox,
            'time_str': time_str,
            'status_code': x.group('status_code'),
            'size': x.group('size'),
            }
    matches = []
    # with open(filename) as f:
        # for i, l in enumerate(f):
        #     print(i)
        #     if i < 10:
        #         matches.append(do_work(i, l))
        #     else:
        #         break

    matches = (do_work(i, line) for i, line in enumerate(open(filename).readlines()))

    return (make_entry(x) for x in matches if x)

def count_value(lst, key):
    d = {}
    for obj in lst:
        val = "%s + %s" % (obj[key], obj["status_code"])
        if val in d:
            d[val] = d[val] + 1
        else:
            d[val] = 1
    return d.items()

def print_results(lst):
    for item in lst:
        print ("%80s %10s" % (item[0], item[1]))

def filter (entries):
    returned = []
    for item in entries:
        hour = item['time'].hour
        min = item['time'].minute
        tm = (hour * 60) + min
        # if "pub:" in item['query'] or "pub%3A" in item['query']:
        #     returned.append(item)
        # only get entries between 4:30PM and 6:00PM
        # if tm >= ((16*60)+30) and tm <= ((18*60)) and int(item['status_code']) != 200:
        #     returned.append(item)
        # if tm >= ((16*60)+30) and tm <= ((18*60)):
        #     returned.append(item)
        returned.append(item)
    return returned

def generic_report_for_key(key, filename, cutoff, quantity):
    'Handles creating generic reports.'
    entries = parse(filename)

    # Sample one 200 request for each combination of
    # request, layers, path, dim
    new_entries = []
    matched = {}
    total = 0
    scope = 0
    for item in entries:
        total = total + 1
        if item['status_code'] == '200' and (item['request'] == 'GETMAP'):
            scope = scope + 1
            #key = "%s%s%s%s" % (item['request'], item['layers'], item['path'], item['dim'])
            key = item['query']
            if key not in matched:
                matched[key] = 'added'
                new_entries.append(item)

    # entries = filter(entries)
    # lst = count_value(entries, key)
    # lst = sorted(lst, key=itemgetter(1), reverse=True)
    # lst =  restrict(lst, cutoff, quantity)
    # print_results(lst)
    print("TOTAL=")
    print(total)
    print("SCOPE=")
    print(scope)
    print("ENTRIES=")
    print(len(new_entries))

    f = open("data/prod-samples.txt", "w")
    for item in new_entries:
        f.write("%s\n" % json.dumps(item))
    f.close()    

def main():
    p = OptionParser("usage: parser.py file")
    p.add_option('-c','--cutoff',dest='cutoff',
                 help="CUTOFF for minimum hits",
                 metavar="CUTOFF")
    p.add_option('-q','--quantity',dest='quantity',
                 help="QUANTITY of results to return",
                 metavar="QUANTITY")
    (options, args) = p.parse_args()
    if len(args) < 1:
        p.error("must specify a file to parse")

    filename = args[0]
    report_type = 'n/a'
    cutoff = int(options.cutoff) if options.cutoff else None
    qty = int(options.quantity) if options.quantity else None
    
    generic_report_for_key(report_type, filename, cutoff, qty)

if __name__ == '__main__':
    main()
