import random
import time
from locust import HttpUser, task, between
from urllib.parse import urlparse, parse_qs

def get_random_integer(min_val, max_val):
    return random.randint(min_val, max_val)

class GeoserverQueries(HttpUser):
    wait_time = between(.5, .5)

    @task
    def call(self):

      #headers={'Connection':'close'}
      headers={}

      bbox = [-14264983.966692736,7887078.326577629,-12906239.351895442,8176927.537835013]

      bbox[0] = -14264983 - (get_random_integer(966690000, 966698000)/1000000000)

      url = "/geo/wms?service=WMS&request=GetMap&version=1.1.1&layers=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_BANS_AND_PROHIBITIONS_SP&format=image%2Fpng&transparent=true&cql_filter=ACCESS_PROHIBITION_DESCRIPTION%20LIKE%20%27%25Campfire%25%27&sld_body=%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22ISO-8859-1%22%3F%3E%3CStyledLayerDescriptor%20xmlns%3D%22http%3A%2F%2Fwww.opengis.net%2Fsld%22%20xmlns%3Asld%3D%22http%3A%2F%2Fwww.opengis.net%2Fsld%22%20xmlns%3Aogc%3D%22http%3A%2F%2Fwww.opengis.net%2Fogc%22%20xmlns%3Agml%3D%22http%3A%2F%2Fwww.opengis.net%2Fgml%22%20version%3D%221.0.0%22%3E%3CNamedLayer%3E%3CName%3Epub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_BANS_AND_PROHIBITIONS_SP%3C%2FName%3E%3CUserStyle%3E%3CName%3Estyle%3C%2FName%3E%3CIsDefault%3E1%3C%2FIsDefault%3E%3CFeatureTypeStyle%3E%3CRule%3E%3CTitle%3Ehighlight%3C%2FTitle%3E%3CPolygonSymbolizer%3E%3CFill%3E%3CGraphicFill%3E%3CGraphic%3E%3CMark%3E%3CWellKnownName%3Eshape%3A%2F%2Fslash%3C%2FWellKnownName%3E%3CStroke%3E%3CCssParameter%20name%3D%22stroke%22%3E%23b75301%3C%2FCssParameter%3E%3CCssParameter%20name%3D%22stroke-width%22%3E2%3C%2FCssParameter%3E%3CCssParameter%20name%3D%22stroke-opacity%22%3E1.0%3C%2FCssParameter%3E%3C%2FStroke%3E%3C%2FMark%3E%3C%2FGraphic%3E%3C%2FGraphicFill%3E%3C%2FFill%3E%3CStroke%3E%3CCssParameter%20name%3D%22stroke%22%3E%23000000%3C%2FCssParameter%3E%3CCssParameter%20name%3D%22stroke-width%22%3E2%3C%2FCssParameter%3E%3CCssParameter%20name%3D%22stroke-opacity%22%3E1.0%3C%2FCssParameter%3E%3C%2FStroke%3E%3C%2FPolygonSymbolizer%3E%3C%2FRule%3E%3C%2FFeatureTypeStyle%3E%3C%2FUserStyle%3E%3C%2FNamedLayer%3E%3C%2FStyledLayerDescriptor%3E%20&srs=EPSG%3A3857&width=1111&height=237&bbox=" + ",".join(str(x) for x in bbox)

      o = urlparse(url)

      uri_query = parse_qs(o.query)
      request = "undefined"
      if "request" in uri_query:
         request = uri_query["request"][0].lower()
      elif "REQUEST" in uri_query:
         request = uri_query["REQUEST"][0].lower()
      
      try:
        response = self.client.get("%s" % url, name="%s-%s-%s" % (request, uri_query['version'][0], uri_query['layers'][0]), headers=headers)

        if response.status_code != 200:
           response.raise_for_status()

      except Exception as ex:
        print("Exception.. Sleep for a bit..")
        print(ex)
        time.sleep(1)
        raise ex
