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

file_queue = open("data/prod-samples.txt", "r")

class GeoserverQueries(HttpUser):
    counter = 0

    wait_time = between(0, 0)

    @task
    def call_geowebcache(self):

      current_counter = GeoserverQueries.counter = GeoserverQueries.counter + 1

      #headers={'Connection':'close'}
      headers={}

      next_request = next(file_queue, None)
      if next_request is None:
         print("All Done!")
         raise StopUser()

      # while current_counter != 8995 and next_request is not None:
      #    current_counter = GeoserverQueries.counter = GeoserverQueries.counter + 1
      #    next_request = next(file_queue, None)
      # if next_request is None:
      #    print("All Done!")
      #    raise StopUser()
          
      query = json.loads(next_request)
      # while query['path'].startswith('/imagex/') or query['path'].startswith('/lzt/'):
      #   next_request = next(file_queue, None)
      #   if next_request is None:
      #     print("All Done!")
      #     raise StopUser()
      #   query = json.loads(next_request)

      uri = query["uri"]
      uri = "%s" % uri
      
      o = urlparse(uri)

      uri_query = parse_qs(o.query)
      request = "undefined"
      if "request" in uri_query:
         request = uri_query["request"][0].lower()
      elif "REQUEST" in uri_query:
         request = uri_query["REQUEST"][0].lower()

      # Skip getmap and getlegendgraphic since they already go to openshift
      if request == 'getmap' or request == 'getlegendgraphic':
         return

      try:
        #print("[%8d] Calling %s\n" % (current_counter, uri))
        response = self.client.get("%s" % uri, name="%s-%s-%s" % (query['status_code'], request, query['layers']), headers=headers, timeout=20)

        if response.status_code != 200 and response.status_code != 417:
           response.raise_for_status()

        content_type = response.headers['content-type']
        file_type = 'dat'
        if 'png' in content_type:
           file_type = 'png'
        elif 'xml' in content_type or 'gml' in content_type:
           file_type = 'xml'
        elif 'json' in content_type:
           file_type = 'json'

        try:
         with open("_tmp/baseline/%06d.%s" % (current_counter, file_type), "rb") as r:
               baseline = r.read()
               if request == "getlegendgraphic":
                  # Assume legend graphic is accurate except for font
                  print("[%8d] ASSUME OK  : LEGEND SKIP" % (current_counter))
               # elif content_type == 'application/vnd.google-earth.kml+xml':
               #    # Google Earth kml files
               elif content_type == 'text/javascript;charset=UTF-8':
                  print("[%8d] ASSUME OK  : JS SKIP" % (current_counter))
               elif content_type == 'image/png':
                  try:
                     mse = compare_images(baseline, response.content)
                     if mse > 1500:
                        error_report("[%8d] ERR : IMAGE MISMATCH %s" % (current_counter, mse))
                        with open("_tmp/gscloud/%06d-IMGMS-A.%s" % (current_counter, file_type), "wb") as r:
                           r.write(baseline)
                        with open("_tmp/gscloud/%06d-IMGMS-B.%s" % (current_counter, file_type), "wb") as r:
                           r.write(response.content)
                     else:
                        print("[%8d] OK  : IMAGE %s" % (current_counter, mse))

                  except ValueError as err:
                     error_report("[%8d] ERR : IMAGE %s %s" % (current_counter, content_type, err))
                     with open("_tmp/gscloud/%06d-IMGER-A.%s" % (current_counter, file_type), "wb") as r:
                        r.write(baseline)
                     with open("_tmp/gscloud/%06d-IMGER-B.%s" % (current_counter, file_type), "wb") as r:
                        r.write(response.content)
               elif content_type =="application/json;charset=UTF-8":
                  file_type = "json"
                  target = str(response.content, 'utf-8')
                  comp_target = json.loads(target)
                  comp_target["timeStamp"] = ""
                  #clean_features(comp_target)
                  comp_baseline = json.loads(baseline)
                  comp_baseline["timeStamp"] = ""
                  #clean_features(comp_baseline)
                  if json.dumps(comp_baseline) == json.dumps(comp_target):
                     print("[%8d] OK  : %s" % (current_counter, content_type))
                  else:
                     error_report("[%8d] ERR : JSON MISMATCH %s" % (current_counter, content_type))
                     with open("_tmp/gscloud/%06d-MISS-A.%s" % (current_counter, file_type), "wb") as r:
                        r.write(baseline)
                     with open("_tmp/gscloud/%06d-MISS-B.%s" % (current_counter, file_type), "wb") as r:
                        r.write(str.encode(target))

               elif content_type == 'text/xml; subtype=gml/3.1.1' or \
                     content_type == 'text/xml; charset=UTF-8' or \
                     content_type == 'application/vnd.ogc.gml' or \
                     content_type == 'application/vnd.google-earth.kml+xml' or \
                     content_type == 'application/gml+xml; version=3.2' or \
                     content_type == 'application/rss+xml; charset=UTF-8':
                  file_type = "xml"
                  target = str(response.content, 'utf-8')
                  target = target.replace('gscloud.api.gov.bc.ca', 'openmaps.gov.bc.ca')
                  target = target.replace('schemaLocation="https://openmaps.gov.bc.ca', 'schemaLocation="http://openmaps.gov.bc.ca')
                  # target_masked = mask_xml(target)
                  # target_masked = target_masked.replace('gscloud.api.gov.bc.ca', 'openmaps.gov.bc.ca')
                  # baseline_masked = mask_xml(str(baseline, 'utf-8'))
                  baseline_masked = str(baseline, 'utf-8')
                  compare (str.encode(baseline_masked), str.encode(target), current_counter, content_type, file_type)

               else:
                  target = str(response.content, 'utf-8')
                  target = target.replace('gscloud.api.gov.bc.ca', 'openmaps.gov.bc.ca')
                  target = target.replace('schemaLocation="https://openmaps.gov.bc.ca', 'schemaLocation="http://openmaps.gov.bc.ca')
                  #baseline_str = str(baseline, 'utf-8')
                  target_bytes = str.encode(target)
                  compare (baseline, target_bytes, current_counter, content_type, file_type)
        except FileNotFoundError as err:
         error_report("[%8d] ERR : FILENOTFOUND %s" % (current_counter, content_type))
         with open("_tmp/gscloud/%06d-MISS-B.%s" % (current_counter, file_type), "wb") as r:
            r.write(response.content)

      except Exception as ex:
        error_report("[%8d] ERR : EXCEPTION %s" % (current_counter, ex))
        print("Exception.. Sleep for a bit..")
        print(ex)
        time.sleep(1)
        raise ex


# pip3 install scikit-image numpy opencv-python
def compare_images (image1_bytes, image2_bytes):
   from skimage.metrics import structural_similarity as ssim
   import numpy as np
   import cv2

   nparr = np.frombuffer(image1_bytes, np.uint8)
   image1 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

   nparr = np.frombuffer(image2_bytes, np.uint8)
   image2 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

   return mse(image1, image2)

def mse(imageA, imageB):
   import numpy as np
   # the 'Mean Squared Error' between the two images is the
   # sum of the squared difference between the two images;
   # NOTE: the two images must have the same dimension
   err = np.sum((imageA.astype("float") - imageB.astype("float")) ** 2)
   err /= float(imageA.shape[0] * imageA.shape[1])
	
   # return the MSE, the lower the error, the more "similar"
   # the two images are
   return err


def error_report (line):
   print(line)
   with open('_tmp/error_report.txt', 'a') as f:
      f.write("%s\n" % line)

# Function to extract namespaces
def extract_namespaces(xml_string):
    events = "start", "start-ns"
    namespaces = defaultdict(str)
    for event, elem in ET.iterparse(StringIO(xml_string), events):
        if event == "start-ns":
            namespaces[elem[0]] = elem[1]
    return namespaces

def mask_xml (xml_string):

   # Load the XML file
   tree = ET.fromstring(xml_string)
   root = tree

   namespaces = extract_namespaces(xml_string)

   if 'timeStamp' in root.attrib:
      del root.attrib['timeStamp']

   # Find the element and remove the attribute
   for elem in root.findall('.//gml:featureMember//*', namespaces):
      if '{http://www.opengis.net/gml}id' in elem.attrib:
         elem.set('{http://www.opengis.net/gml}id', "ID")

   for elem in root.findall('.//gml:featureMembers//*', namespaces):
      if '{http://www.opengis.net/gml}id' in elem.attrib:
         elem.set('{http://www.opengis.net/gml}id', "ID")

   for pars in root.findall('.//gml:featureMembers/*', namespaces):
      for elem in pars.findall('.//pub:OBJECTID', namespaces):
         pars.remove(elem)
      for elem in pars.findall('.//pub:PARCEL_FABRIC_POLY_ID', namespaces):
         pars.remove(elem)

   ET.indent(root, space=" ", level=0)

   news = ET.tostring(root, encoding='unicode')
   return news

def clean_features (doc):
   if 'features' in doc:
      for feature in doc["features"]:
         feature['id'] = ""
         feature['properties']['PARCEL_FABRIC_POLY_ID'] = "0"
         feature['properties']['OBJECTID'] = "0"

def compare (baseline, target, current_counter, content_type, file_type):
   if baseline == target:
      print("[%8d] OK  : %s" % (current_counter, content_type))
   else:
      error_report("[%8d] ERR : MISMATCH %s" % (current_counter, content_type))
      with open("_tmp/gscloud/%06d-MISS-A.%s" % (current_counter, file_type), "wb") as r:
         r.write(baseline)
      with open("_tmp/gscloud/%06d-MISS-B.%s" % (current_counter, file_type), "wb") as r:
         r.write(target)
