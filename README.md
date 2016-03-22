Pivot Chart Demo
================

This is a project that uses ElasticSearch, Flask, and the d3 library XCharts to demonstrate pivot charts and graphs based on queries to ElasticSearch. The front-end uses Twitter Bootstrap.

Requirements
------------

You need to ElasticSearch to run this project.

Setup
-----

Check out a fresh copy and enter the directory:
```bash
$ git clone https://github.com/chaimpeck/pivot-chart-demo.git
$ cd pivot-chart-demo
```

Install the Python dependencies:
```bash
$ pip install -r requirements.txt
```

You need to set up the schema in ElasticSearch (which should already be running):
```bash
$ curl -XPUT "http://localhost:9200/pivot-demo/" -d'
{
   "mappings": {
      "entry": {
         "properties": {
            "gender": {
               "type": "string"
            },
            "age": {
               "type": "integer"
            },
            "household_income": {
                "type": "integer"
            },
            "favorite_color": {
                "type": "string",
                "index": "not_analyzed"
            },
            "QS6_6": {
                "type": "string",
                "index": "not_analyzed"
            },
            "Q30b": {
                "type": "string",
                "index": "not_analyzed"
            },
            "Q31_1": {
                "type": "string",
                "index": "not_analyzed"
            }
         }
      }
   }
}'
```

Generate 100k sample entries:
```bash
python generate-random-data.py -n 100000  > sample-data.json
```

Load the sample data into ElasticSearch:
```bash
python load-es.py sample-data.json
```

Run the demo:
```bash
python pivot_demo_service.py -p 8080
```

You should now be able to view the demo in a web browser:
http://localhost:8080

Screenshots
-----------

![Alt text](/screenshots/graph.png?raw=true "Graph")

![Alt text](/screenshots/chart.png?raw=true "Chart")
