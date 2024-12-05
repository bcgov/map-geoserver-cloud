from locust.exception import StopUser
from locust import HttpUser, task, between
import time
import json
import urllib
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import time

file_queue = open("data/prod-samples.txt", "r")

class GeoserverQueries(HttpUser):
    counter = 0

    wait_time = between(.5, .5)

    @task
    def call_geowebcache(self):

      current_counter = GeoserverQueries.counter = GeoserverQueries.counter + 1

      #headers={'Connection':'close'}
      headers={}

      next_request = next(file_queue, None)
      if next_request is None:
         print("All Done!")
         raise StopUser()
      query = json.loads(next_request)
      # while query['path'].startswith('/imagex/') or query['path'].startswith('/lzt/'):
      #   next_request = next(file_queue, None)
      #   if next_request is None:
      #     print("All Done!")
      #     raise StopUser()
      #   query = json.loads(next_request)

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

      if request == 'getlegendgraphic' or request == 'getmap':
         return
   
      uri = "/compare?%s" % urllib.parse.urlencode(q)
      
      
      try:
        print("[%8d] Calling %s\n" % (current_counter, uri))
        response = self.client.get("%s" % uri, name="%s-%s" % (query['status_code'], query['layers']), headers=headers)

        response.raise_for_status()

        content_type = response.headers['content-type']
        file_type = 'dat'
        if 'png' in content_type:
           file_type = 'png'
        elif 'xml' in content_type or 'gml' in content_type:
           file_type = 'xml'
        elif 'json' in content_type:
           file_type = 'json'
      #   with open("_tmp/baseline/%06d.%s" % (current_counter, file_type), "wb") as r:
      #      r.write(response.content)

      except Exception as ex:
        print("Exception.. Sleep for a bit..")
        print(ex)
        time.sleep(1)
        raise ex
