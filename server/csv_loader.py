import csv
import json
from flask import Flask, request
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

PRECISION = 4

def load_data():
    d = {}
    with open('data_export_09-2015.csv', 'r') as csvfile:
        spamreader = csv.reader(csvfile, delimiter=',', quotechar='|')
        next(spamreader)
        for row in spamreader:
            x = round(float(row[3]), PRECISION)
            y = round(float(row[2]), PRECISION)
            t = (x,y)
            if t not in d:
                d[t] = [0, 0]
            d[t][0] += float(row[7])
            d[t][1] += 1
    return d

DATA = load_data()

def reduce_response(data, precision):
    while(len(data) > 5000 and precision > 0):
        precision -= 1
        new_data = {}
        for x, y in data:
            value = data[(x, y)]
            x = round(x, precision)
            y = round(y, precision)
            t = (x, y)
            if t not in new_data:
                new_data[t] = [0, 0]
            new_data[t][0] += value[0]
            new_data[t][1] += value[1]
        data = new_data
    for i in data:
        data[i] = round(data[i][0] / data[i][1], PRECISION)
    return data


def get_intensity(x1, y1, x2, y2):
    ret = {}
    for t in DATA:
        if x1 < t[0] < x2 and y2 < t[1] < y1:
            ret[t] = DATA[t]
    return ret


def data_to_list(data):
    l = []
    for t in data:
        l.append(t[0])
        l.append(t[1])
        l.append(data[t])
    return l


@app.route("/", methods=['GET'])
def data_details():
    west = float(request.args.get('west','41'))
    north = float(request.args.get('north','40'))
    east = float(request.args.get('east','42'))
    south = float(request.args.get('south','41'))
    data = get_intensity(west, north, east, south)
    data = reduce_response(data, PRECISION)
    data = data_to_list(data)
    return json.dumps(data)

if __name__ == "__main__":
    app.run(debug=True)
