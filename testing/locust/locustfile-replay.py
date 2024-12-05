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

      # Skip getmap and getlegendgraphic since they already go to openshift
      if request == 'getmap' or request == 'getlegendgraphic':
         return
   
      # uri = "/compare?%s" % urllib.parse.urlencode(q)
      uri = query["uri"]
      
      try:
        print("[%8d] Calling %s\n" % (current_counter, uri))
        response = self.client.get("%s&gscloud=true" % uri, name="%s-%s" % (query['status_code'], query['layers']), headers=headers, timeout=15)

        if response.status_code != 200 and response.status_code != 417:
           response.raise_for_status()

      except Exception as ex:
        print("Exception.. Sleep for a bit..")
        print(ex)
        raise ex
