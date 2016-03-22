Pivot Chart Demo
================

This is a project that uses ElasticSearch, Flask, and the d3 library XCharts to demonstrate pivot charts and graphs based on aggregation queries to ElasticSearch. The front-end uses BackboneJS and Twitter Bootstrap.

Requirements
------------

You need to have the latest ElasticSearch (tested on 2.1.1) installed to run this project.

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

If you are accessing it remotely, you will need to supply the username/password: pivot/demo

The Front-end
-------------

The front-end consists of three views:
* Pivot Table: Demonstrates pivot tables that dynamically generated based on a query to elastic search
* Filters: Allows user interaction to modify the filters by adjusting sliders and checkboxes. The graph changes with the user's actions
* Search: Send raw queries to elasticsearch - mostly useful for debugging.

Screenshots
-----------

This is the graph view:
![Alt text](/screenshots/graph.png?raw=true "Graph")

And this is the chart view:
![Alt text](/screenshots/chart.png?raw=true "Chart")
