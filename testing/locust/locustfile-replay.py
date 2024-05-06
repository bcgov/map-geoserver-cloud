from locust.exception import StopUser
from locust import HttpUser, task, between
import time
import json
from datetime import datetime
import time

file_queue = open("data/prod-samples.txt", "r")

class GeoserverQueries(HttpUser):
    counter = 0

    wait_time = between(1, 1)

    @task
    def call_geowebcache(self):

      GeoserverQueries.counter = GeoserverQueries.counter + 1

      #headers={'Connection':'close'}
      headers={}

      next_request = next(file_queue, None)
      if next_request is None:
         print("All Done!")
         raise StopUser()
      query = json.loads(next_request)
      while query['path'].startswith('/imagex/') or query['path'].startswith('/lzt/'):
        next_request = next(file_queue, None)
        if next_request is None:
          print("All Done!")
          raise StopUser()
        query = json.loads(next_request)

      uri = query["uri"]

      try:
        print("[%8d] Calling %s\n" % (GeoserverQueries.counter, uri))
        response = self.client.get("%s" % uri, name="%s-%s" % (query['status_code'], query['layers']), headers=headers)

        response.raise_for_status()

      except Exception as ex:
        print("Exception.. Sleep for a bit..")
        print(ex)
        time.sleep(1)
        raise ex
