# The workflows/images.yml jobs are created by running this!
import yaml

docker_items = ['gwc', 'wfs', 'wms', 'wms-p6spy', 'geokml', 'geosld', 'getcaps']

workflow = """
#######################
#######################
#######################
#######################
# !!
# DO NOT EDIT!!
# !!
# THIS IS GENERATED - SEE .github/job-docker-image.py
# !!
#######################
#######################
#######################
#######################
name: Dockerfiles

on:
  push:
    branches: [ images/* ]
  workflow_dispatch:
    inputs:
      build_all:
        description: 'Build All'
        required: true
        default: 'NO'    
env:
  BUILD_ALL: ${{ inputs.build_all }}
  REGISTRY: artifacts.developer.gov.bc.ca
  REGISTRY_USERNAME: ${{ secrets.REGISTRY_USERNAME }}
  REGISTRY_PASSWORD: ${{ secrets.REGISTRY_PASSWORD }}
  REGISTRY_REPO_NAME: ${{ secrets.REGISTRY_REPO_NAME }}

"""

jobs = {}
for item in docker_items:
    with open('job-docker-image.template.yml') as file:
        job = yaml.load(file, Loader=yaml.FullLoader)
        job['build']['env']['DOCKER_ITEM'] = item
        job['build']['name'] = "%s image" % item
        jobs[item] = job['build']

workflow = "%s%s" % (workflow, yaml.dump({"jobs": jobs}))
with open('workflows/images.yml', 'w') as file:
    file.write(workflow)