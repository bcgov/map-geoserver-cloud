import os
from locust import HttpUser, task, between
import time
import random
import json
from datetime import datetime
import time

def time_in_seconds(t):
  return (t.hour * 60 + t.minute) * 60 + t.second

def current_secs():
  return time_in_seconds(datetime.now().time())

file_queue = open("_tmp/replay-input.log", "r")

start_secs = current_secs()

def find_next():

  query = json.loads(next(file_queue))

  # "time_str": "13/Aug/2023:16:00:00 -0700"
  time_str = query['time_str']
  t = datetime.strptime(time_str, '%d/%b/%Y:%H:%M:%S %z').time()

class QueryGeoWebCache(HttpUser):
    wait_time = between(.5, .5)

    @task
    def call_geowebcache(self):

      #headers={'Connection':'close'}
      headers={}

      query = json.loads(next(file_queue))

      # "time_str": "13/Aug/2023:16:00:00 -0700"
      time_str = query['time_str']
      t = datetime.strptime(time_str, '%d/%b/%Y:%H:%M:%S %z').time()

      seconds = (t.hour * 60 + t.minute) * 60 + t.second

      print("%d -- %d" % (start_secs, seconds))

      # don't wait for any traffic where it is higher than the sec_window
      sec_window = (current_secs() - start_secs)

      if ((seconds - 57600) > sec_window):
        sleep_time = (seconds - 57600) - sec_window
        print("Sleeping %d seconds" % sleep_time)
        time.sleep(sleep_time)

      try:
        response = self.client.get("%s" % (query["uri"]), name="%s-%s" % (query['status_code'], query['layers']), headers=headers)

        #response.raise_for_status()

      except Exception as ex:
        print("Exception.. Sleep for a bit..")
        print(ex)
        time.sleep(1)
        raise ex
