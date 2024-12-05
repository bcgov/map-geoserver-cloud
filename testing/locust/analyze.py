from locust.exception import StopUser
from locust import HttpUser, task, between
import time
import json
from datetime import datetime
import time
from urllib.parse import urlparse, parse_qs
import xml.etree.ElementTree as ET
from collections import defaultdict
from io import StringIO
from pathlib import Path
import filetype
from html.parser import HTMLParser

MATCH = 0

def get_value (uri_query, key):
    answer = "undefined"
    if key in uri_query:
        answer = uri_query[key][0].lower()
    elif key.upper() in uri_query:
        answer = uri_query[key.upper()][0].lower()
    return answer

def do():
    file_queue = open("data/prod-samples.txt", "r")

    next_request = next(file_queue, None)

    current_counter = 1

    counters = Counters()

    while next_request != None:

        # if ONE and current_counter == 9793:
        #     break;        
        if MATCH > 0 and current_counter != MATCH:
            current_counter = current_counter + 1
            next_request = next(file_queue, None)
            continue

        query = json.loads(next_request)
        uri = query["uri"]
        uri = "%s" % uri
        
        o = urlparse(uri)

        uri_query = parse_qs(o.query)
        service = get_value (uri_query, "service")
        request = get_value (uri_query, "request")

        request = "%s.%s" % (service, request)
        
        # p = Path("_tmp/gscloud/%06d-MISS-%s.%s" % (current_counter, "A", "xml"))
        # if not p.is_file() or request != "getfeatureinfo":
        #     current_counter = current_counter + 1
        #     next_request = next(file_queue, None)
        #     continue

        print("[%06d]" % current_counter)

        # p = Path("_tmp/gscloud/%06d-MISS-%s.%s" % (current_counter, "A", "json"))
        # if p.exists():
        #     # sub_sample("json", next_request)
        #     file_a = find_file(current_counter, "A")
        #     file_b = find_file(current_counter, "B")

        #     if (eval_json(current_counter, request, counters, file_a, file_b)):
        #         None
        #     else:
        #         counters.get("%-26s: other" % request).inc()

        file_a = find_file(current_counter, "A")
        file_b = find_file(current_counter, "B")

        if file_a is None and file_b is None:
            counters.get("%-26sY ok" % request).inc()
        elif file_a is None and file_b is not None:
            counters.get("%-26s: mismatch" % request).inc()
            sub_sample('gap', "%-07d : %-26s: mismatch - missing source" % (current_counter, request))
        elif (eval_xml(current_counter, request, counters, file_a, file_b)):
            None
        elif (eval_json(current_counter, request, counters, file_a, file_b)):
            None
        elif (eval_png(file_a)):
            counters.get("%-26s: png" % request).inc()
        elif (eval_html(current_counter, request, counters, file_a, file_b)):
            None
        else:
            counters.get("%-26s: other" % request).inc()
            sub_sample('gap', "%-07d : %-26s: other" % (current_counter, request))

            #return

        current_counter = current_counter + 1
        next_request = next(file_queue, None)

    counters.print()

class Counter:
    def __init__(self):
        self.counter = 0
    def inc(self):
        self.counter = self.counter + 1
    def get(self):
        return self.counter

class Counters:
    counters = {}
    def get(self, counter):
        if counter not in self.counters:
            self.counters[counter] = Counter()
        return self.counters[counter]
    
    def print(self):
        total = 0
        for counter in sorted(self.counters.keys()):
            print("[%-80s] %d" % (counter, self.counters[counter].get()))
            total = total + self.counters[counter].get()
        print("Total %d" % total)

def find_file (current_counter, a_or_b):
    file_type = "dat"
    for file_type in ['dat', 'png', 'json', 'xml']:
        p = Path("_tmp/gscloud/%06d-MISS-%s.%s" % (current_counter, a_or_b, file_type))
        if p.is_file():
            with open(p, "rb") as fo:
                return fo.read()

    file_type = "png"
    p = Path("_tmp/gscloud/%06d-IMGMS-%s.%s" % (current_counter, a_or_b, file_type))
    if p.is_file():
        with open(p, "rb") as fo:
            return fo.read()

    return None

# Function to extract namespaces
def extract_namespaces(xml_string):
    events = "start", "start-ns"
    namespaces = defaultdict(str)
    for event, elem in ET.iterparse(StringIO(xml_string), events):
        if event == "start-ns":
            namespaces[elem[0]] = elem[1]
    return namespaces

def sub_sample (filename, line):
   with open('data/%s.txt' % filename, 'a') as f:
      f.write(line)
      f.write("\n")


def clean_xml (xml_bytes):
    xml_string = str(xml_bytes, "utf-8")
    # xml_string = xml_string.replace('https://gscloud.api.gov.bc.ca', 'https://openmaps.gov.bc.ca')
    xml_string = xml_string.replace('http://openmaps.gov.bc.ca', 'https://openmaps.gov.bc.ca')
    namespaces = extract_namespaces(xml_string)
    tree = ET.fromstring(xml_string)

    if tree.tag == "ServiceExceptionReport":
        lines = xml_string.splitlines()
        return "%s\n%s\n%s" % (lines[0], lines[1], lines[2])
    else:
        if 'timeStamp' in tree.attrib:
            del tree.attrib['timeStamp']

        # Ignore the schemaLocation url differences
        tree.set('{http://www.w3.org/2001/XMLSchema-instance}schemaLocation', "")

        for elem in tree.findall('./{http://www.w3.org/2001/XMLSchema}import'):
            elem.set("schemaLocation", "")

        # Ignore "next" url differences
        tree.set('next', "")

        # Ignore the system generated identifiers
        for elem in tree.findall('.//{http://www.opengis.net/wfs/2.0}member//*', namespaces):
            if '{http://www.opengis.net/gml/3.2}id' in elem.attrib:
                elem.set('{http://www.opengis.net/gml/3.2}id', "ID")
            for elem2 in elem.findall('.//ns2:GEOMETRY//*', namespaces):
                if '{http://www.opengis.net/gml/3.2}id' in elem2.attrib:
                    elem2.set('{http://www.opengis.net/gml/3.2}id', "ID")

        # Ignore the system generated identifiers
        for elem in tree.findall('.//{http://www.opengis.net/gml}featureMembers/*', namespaces):
            if '{http://www.opengis.net/gml}id' in elem.attrib:
                elem.set('{http://www.opengis.net/gml}id', "ID")

        # Ignore the system generated identifiers
        for elem in tree.findall('./{http://www.opengis.net/gml}featureMember/*', namespaces):
            if 'fid' in elem.attrib:
                elem.set('fid', "ID")
            el = elem.findall('./{http://delivery.openmaps.gov.bc.ca/geo/}OBJECTID', namespaces).pop()
            elem.remove(el)
            el_list = elem.findall('./{http://delivery.openmaps.gov.bc.ca/geo/}SE_ANNO_CAD_DATA', namespaces)
            for el in el_list:
                elem.remove(el)

        for elem in tree.findall('./{http://www.opengis.net/wfs/2.0}member/*', namespaces):
            if 'fid' in elem.attrib:
                elem.set('fid', "ID")
            el = elem.findall('./{http://delivery.openmaps.gov.bc.ca/geo/}OBJECTID', namespaces).pop()
            elem.remove(el)
                        
        # Ignore the srsName difference
        for elem in tree.findall('.//{http://www.opengis.net/gml}Polygon', namespaces):
            elem.set("srsName", "--IGNORE--")
        for elem in tree.findall('.//{http://www.opengis.net/gml}MultiPolygon', namespaces):
            elem.set("srsName", "--IGNORE--")
        for elem in tree.findall('.//{http://www.opengis.net/gml}Point', namespaces):
            elem.set("srsName", "--IGNORE--")
        for elem in tree.findall('.//{http://www.opengis.net/gml}Box', namespaces):
            elem.set("srsName", "--IGNORE--")
        for elem in tree.findall('.//{http://www.opengis.net/gml/3.2}LineString', namespaces):
            elem.set("srsName", "--IGNORE--")
            if '{http://www.opengis.net/gml/3.2}id' in elem.attrib:
                elem.set('{http://www.opengis.net/gml/3.2}id', "ID")

        # Ignore the coordinates differences
        for elem in tree.findall('.//{http://www.opengis.net/gml}LinearRing', namespaces):
            elem.clear()
        for elem in tree.findall('.//{http://www.opengis.net/gml/3.2}LinearRing', namespaces):
            elem.clear()
        for elem in tree.findall('.//{http://www.opengis.net/gml}coordinates', namespaces):
            elem.clear()
        for elem in tree.findall('.//{http://www.opengis.net/gml/3.2}posList', namespaces):
            elem.clear()

        # KML (493)
        for elem in tree.findall('.//{http://www.opengis.net/kml/2.2}LookAt', namespaces):
            elem.clear()
        for elem in tree.findall('.//{http://www.opengis.net/kml/2.2}href', namespaces):
            elem.clear()

        # WMS_DescribeLayerResponse (420)
        for elem in tree.findall('.//LayerDescription', namespaces):
            elem.set("wfs", "-")
            elem.set("owsURL", "-")


    ET.indent(tree, space=" ", level=0)

    return ET.tostring(tree, encoding='unicode')

def eval_xml (current_counter, request, counters, xml_string_a, xml_string_b):
   try:

        tree_a = ET.fromstring(xml_string_a)
        tree_b = ET.fromstring(xml_string_b)
        if tree_a.tag == tree_b.tag:
            new_a = clean_xml(xml_string_a)
            new_b = clean_xml(xml_string_b)
            if str.encode(new_a) == str.encode(new_b):
                counters.get("%-26sY xml %s" % (request, tree_a.tag)).inc()
            else:
                if MATCH > 0:
                    print(new_a)
                    print(new_b)
                print("[%05d] XML MISMATCH" % current_counter)
                counters.get("%-26sN xml %s" % (request, tree_a.tag)).inc()
                sub_sample('gap', "%-07d : %-26sN xml %s" % (current_counter, request, tree_a.tag))

        else:
            counters.get("%-26sX xml %s %s" % (request, tree_a.tag, tree_b.tag)).inc()
            sub_sample('gap', "%-07d : %-26sX xml %s %s" % (current_counter, request, tree_a.tag, tree_b.tag))
        return True
   except Exception as ex:
       print ("xml", "error", ex)
       return False

def clean_json (data):
    data['timeStamp'] = ''
    for feature in data['features']:
        feature['id'] = 'id'
        feature['properties']['EMRG_OAA_SYSID'] = '0'
        feature['properties']['OBJECTID'] = '0'
        feature['geometry']['coordinates'] = []
        feature['properties'] = {}

def eval_json (current_counter, request, counters, json_bytes_a, json_bytes_b):
    try:
        json_a = json.loads(json_bytes_a)
        json_b = json.loads(json_bytes_b)

        clean_json(json_a)
        clean_json(json_b)

        type_a = json_a['type']
        if type_a is None:
            type_a = "undefined"
        if json.dumps(json_a) == json.dumps(json_b):
            print("JSON OK")
            counters.get("%-26sY json %s" % (request, type_a)).inc()
        else:
            print("JSON Diff %s" % current_counter)
            counters.get("%-26s: json %s" % (request, type_a)).inc()
            sub_sample('gap', "%-07d : %-26s: json %s" % (current_counter, request, type_a))
        return True
    except Exception as ex:
       print ("json", "error", ex)
       return False
 
def eval_png (png_bytes):
    try:
        kind = filetype.guess(png_bytes)
        assert kind is not None and kind.extension == 'png'
        return True
    except Exception as ex:
       print ("png", "error", ex)
       return False
    
def clean_lines (input):
    return "\n".join(l for l in input.splitlines() if l)

def eval_text (current_counter, request, counters, file_a, file_b):
    try:
        file_a_str = str(file_a, 'utf-8')
        file_b_str = str(file_b, 'utf-8')
        if clean_lines(file_a_str) == clean_lines(file_b_str):
            counters.get("%-26sY text" % (request)).inc()
            return True
        return False
    except:
        print("eval_text - exception!")
        return False

def eval_html (current_counter, request, counters, file_a, file_b):

    from lxml import etree
    from io import StringIO

    if eval_text (current_counter, request, counters, file_a, file_b) is True:
        return True

    try:
        html = str(file_a, 'utf-8')
    except:
        html = ""
        counters.get("%-26s: invalid-html-file" % (request)).inc()
        return True

    try:
        etree.parse(StringIO(html), etree.HTMLParser(recover=False))
        counters.get("%-26s: html" % (request)).inc()
        sub_sample('gap', "%-07d : %-26s: html" % (current_counter, request))
        return True
    except Exception as ex:
       print ("html", "error", ex)
       if html.startswith("<html"):
            counters.get("%-26s: invalid-html" % (request)).inc()
            sub_sample('gap', "%-07d : %-26s: invalid-html" % (current_counter, request))
            return True           
       return False
        
    # parser = HTMLParser()
    # parser.feed()
    # parser.feed("<x>fds")
    # print(parser)
do()
