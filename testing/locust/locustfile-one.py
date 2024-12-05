from locust.exception import StopUser
from locust import HttpUser, task, between
import time
import json
import urllib
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import time


class GeoserverQueries(HttpUser):
    counter = 0

    wait_time = between(.5, .5)

    num = 58395622

    @task
    def call_geowebcache(self):

      current_counter = GeoserverQueries.counter = GeoserverQueries.counter + 1

      #headers={'Connection':'close'}
      headers={}

      # next_request = next(file_queue, None)
      # if next_request is None:
      #    print("All Done!")
      #    raise StopUser()
      # query = json.loads(next_request)
      # while query['path'].startswith('/imagex/') or query['path'].startswith('/lzt/'):
      #   next_request = next(file_queue, None)
      #   if next_request is None:
      #     print("All Done!")
      #     raise StopUser()
      #   query = json.loads(next_request)

      num = GeoserverQueries.num = GeoserverQueries.num + 1
      query = {"server_ip": "99.79.50.158", "path": "/geo/pub/ows", "uri": "/geo/pub/ows?service=WMS&request=GetMap&version=1.1.1&layers=pub%3AWHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=6885&format=image%2Fpng&transparent=true&cql_filter=ORDER_ALERT_STATUS%20%3C%3E%20%27All%20Clear%27%20and%20EVENT_TYPE%20%3D%20%27Fire%27&srs=EPSG%3A3857&width=664&height=726&bbox=-15512436.268306812,5513249.976153193,-12264168.31429996,9064820.0" + str(num), "method": "GET", "query": "{'service': ['WMS'], 'request': ['GetMap'], 'version': ['1.1.1'], 'layers': ['pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP'], 'styles': ['6885'], 'format': ['image/png'], 'transparent': ['true'], 'cql_filter': [\"ORDER_ALERT_STATUS <> 'All Clear' and EVENT_TYPE = 'Fire'\"], 'srs': ['EPSG:3857'], 'width': ['664'], 'height': ['726']}", "layers": ["pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP"], "request": "GETMAP", "pathrequest": "/geo/pub/ows.GETMAP", "dim": "['664']x['726']", "bbox": ["-15512436.268306812,5513249.976153193,-12264168.31429996,9064820.058395622"], "time_str": "01/May/2024:05:56:16 -0700", "status_code": "200", "size": "12027"}

      q = {
         "page": query["uri"]
      }

      o = urlparse(query["uri"])

      uri_query = parse_qs(o.query)
      request = "undefined"
      if "request" in uri_query:
         request = uri_query["request"][0].lower()
      elif "REQUEST" in uri_query:
         request = uri_query["REQUEST"][0].lower()

      if request != 'getmap':
         return
   
      # uri = "/compare?%s" % urllib.parse.urlencode(q)
      uri = query["uri"]
      
      try:
        print("[%8d] Calling %s\n" % (current_counter, uri))
        response = self.client.get("%s" % uri, name="%s-%s" % (query['status_code'], query['layers']), headers=headers)

        if response.status_code != 200 and response.status_code != 417:
           response.raise_for_status()

      #   content_type = response.headers['content-type']
      #   file_type = 'dat'
      #   if 'png' in content_type:
      #      file_type = 'png'
      #   elif 'xml' in content_type or 'gml' in content_type:
      #      file_type = 'xml'
      #   elif 'json' in content_type:
      #      file_type = 'json'
      #   with open("_tmp/baseline/%06d.%s" % (current_counter, file_type), "wb") as r:
      #      r.write(response.content)

      except Exception as ex:
        print("Exception.. Sleep for a bit..")
        print(ex)
        raise ex
