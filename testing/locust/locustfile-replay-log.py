from locust.exception import StopUser
from locust import HttpUser, task, between
import time
import json
import urllib
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import time

file_queue = open("data/July-23-2024_19-20.txt", "r")

class GeoserverQueries(HttpUser):
    counter = 0
    previous_timestamp = None  # Store previous timestamp

    wait_time = lambda self: 0  # Disable built-in wait_time

    @task
    def call_geowebcache(self):

      current_counter = GeoserverQueries.counter = GeoserverQueries.counter + 1

      next_request = next(file_queue, None)
      if next_request is None:
         print("All Done!")
         raise StopUser()
      query = json.loads(next_request)

      # Parse the time_str from the log
      time_str = query.get("time_str")
      if time_str:
         current_timestamp = datetime.strptime(time_str, "%d/%b/%Y:%H:%M:%S %z")
         if GeoserverQueries.previous_timestamp is not None:
            delay = (current_timestamp - GeoserverQueries.previous_timestamp).total_seconds()
            if delay > 0:
               print("Sleeping for %f seconds" % delay)
               time.sleep(delay)
         GeoserverQueries.previous_timestamp = current_timestamp

      o = urlparse(query["uri"])
      uri_query = parse_qs(o.query)
      request = "undefined"
      if "request" in uri_query:
         request = uri_query["request"][0].lower()
      elif "REQUEST" in uri_query:
         request = uri_query["REQUEST"][0].lower()

      # Skip getmap and getlegendgraphic since they already go to openshift
      #if request == 'getmap' or request == 'getlegendgraphic':
      #   return
   
      try:
        print("[%8d] Calling %s\n" % (current_counter, query["uri"]))
        response = self.client.get("%s" % query["uri"], name="%s-%s" % (query['status_code'], query['layers']), timeout=15)

        if response.status_code != 200 and response.status_code != 417:
           with open("_tmp/baseline/%06d.%s" % (current_counter, "txt"), "wb") as r:
              r.write(str.encode("Exception\n%s\n%s" % (str(response.status_code), str(response.content))))
           
           response.raise_for_status()

        content_type = response.headers['content-type']
        file_type = 'dat'
        if 'png' in content_type:
           file_type = 'png'
        elif 'xml' in content_type or 'gml' in content_type:
           file_type = 'xml'
        elif 'json' in content_type:
           file_type = 'json'
        with open("_tmp/baseline/%06d.%s" % (current_counter, file_type), "wb") as r:
           r.write(response.content)

      except Exception as ex:
        print("Exception.. Sleep for a bit..")
        print(ex)
        raise ex
