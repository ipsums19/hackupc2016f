import csv
import json
from flask import Flask, request
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

def load_data():
    d = {}
    with open('data_export_09-2015.csv', 'r') as csvfile:
        spamreader = csv.reader(csvfile, delimiter=',', quotechar='|')
        next(spamreader)
        for row in spamreader:
            x = round(float(row[3]),4)
            y = round(float(row[2]),4)
            t = (x,y)
            if t not in d:
                d[t] = []
            d[t].append(float(row[7]))
    for i in d:
        d[i] = round(sum(d[i]) / len(d[i]),4)
    return d

DATA = load_data()

def get_intensity(x1, y1, x2, y2):
    ret = []
    for x, y in DATA:
        if x1 < x < x2 and y2 < y < y1:
            ret.append(x)
            ret.append(y)
            ret.append(DATA[(x,y)])
    return ret


@app.route("/", methods=['GET'])
def data_details():
    west = float(request.args.get('west','41'))
    north = float(request.args.get('north','40'))
    east = float(request.args.get('east','42'))
    south = float(request.args.get('south','41'))
    return json.dumps(get_intensity(west, north, east, south))

if __name__ == "__main__":
    app.run(debug=True)
